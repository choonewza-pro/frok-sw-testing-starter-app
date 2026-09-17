# Integration Testing Patterns

Architectural principles, sociable testing philosophy, async polling, and scope discipline for TypeScript integration tests.

---

## 1. The Sociable Testing Philosophy

Martin Fowler categorizes tests into two fundamental styles:

- **Solitary Tests (Unit Tests):** Isolate the unit under test by mocking all collaborating classes, functions, and repositories.
- **Sociable Tests (Integration Tests):** Execute the unit under test together with its real collaborators across architectural layers.

```
                    ┌─────────────────────────┐
                    │   HTTP Request/Client   │
                    └────────────┬────────────┘
                                 │
                     ┌───────────▼───────────┐
                     │ Controller/Route      │  ◄── REAL
                     └───────────┬───────────┘
                                 │
                     ┌───────────▼───────────┐
                     │ Domain Service/Logic  │  ◄── REAL
                     └───────────┬───────────┘
                                 │
                     ┌───────────▼───────────┐
                     │ Database Repository   │  ◄── REAL (DO NOT MOCK)
                     └───────────┬───────────┘
                                 │
            ┌────────────────────┴────────────────────┐
            │                                         │
┌───────────▼───────────┐                 ┌───────────▼───────────┐
│ Real Database         │                 │ External 3rd-Party    │
│ (Postgres/MySQL/Redis)│                 │ (Stripe, Twilio)      │
│ ◄── REAL I/O          │                 │ ◄── MOCK VIA MSW      │
└───────────────────────┘                 └───────────────────────┘
```

### The Golden Rule of Integration Testing

> **Do not mock your own code.**
> If you mock the repository or service layer, you have destroyed the integration test and turned it into an expensive, slow unit test.
>
> Mock **only** external 3rd-party networks that you cannot run locally in Docker (e.g. Stripe API, SMS Provider, External OAuth).

---

## 2. Testing Trophy: Scope & Balance

Integration tests give higher confidence than unit tests, but execute slower (50ms–500ms vs 1ms). Follow the **Testing Trophy** philosophy to avoid test suite bloat:

| Test Type | What to Test Here | What NOT to Test Here |
|---|---|---|
| **Unit Test** | Complex business algorithms, regex validation, formatting functions, 20 branch permutations | Database queries, real network requests, middleware chains |
| **Integration Test** | End-to-end API flows, database transactions, foreign key constraints, authentication guards, cache invalidation | 15 variations of input formatting, boundary math values |

### Decision Rule
- Does this test verify that **two or more real components collaborate correctly** (e.g. controller writes to database)? → **Integration Test**
- Does this test verify a **pure algorithmic calculation or decision table**? → **Unit Test**

---

## 3. Asynchronous Operations & Event-Driven Flows

Real backend systems frequently trigger asynchronous background tasks (e.g., BullMQ jobs, RabbitMQ events, Kafka messages, or background database syncs).

### ❌ The "Sleep" Anti-Pattern (Recipe for Flaky Tests)

```typescript
// ❌ WRONG — arbitrary sleep causes flakiness in CI and slows down test suites
it('processes image upload in background', async () => {
  await request(app).post('/api/images').send(imageData)

  await new Promise((resolve) => setTimeout(resolve, 3000)) // Flaky and slow!

  const processed = await prisma.image.findUnique({ where: { id: 1 } })
  expect(processed?.status).toBe('COMPLETED')
})
```

### ✅ The Deterministic Polling Pattern (`waitFor`)

Never sleep. Poll repeatedly until the condition is met or a timeout expires:

```typescript
/**
 * Deterministic polling utility for integration tests
 */
export async function waitFor<T>(
  assertion: () => Promise<T> | T,
  options: { timeout?: number; interval?: number } = {}
): Promise<T> {
  const { timeout = 5000, interval = 50 } = options
  const startTime = Date.now()

  let lastError: unknown

  while (Date.now() - startTime < timeout) {
    try {
      return await assertion()
    } catch (err) {
      lastError = err
      await new Promise((resolve) => setTimeout(resolve, interval))
    }
  }

  throw new Error(
    `waitFor timed out after ${timeout}ms. Last error: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  )
}
```

#### Usage in Async Integration Test:

```typescript
it('processes image upload in background', async () => {
  const response = await request(app).post('/api/images').send(imageData)
  const imageId = response.body.id

  // Polls every 50ms, succeeds as soon as DB updates, times out after 4000ms
  await waitFor(async () => {
    const record = await prisma.image.findUnique({ where: { id: imageId } })
    expect(record?.status).toBe('COMPLETED')
    expect(record?.thumbnailUrl).toBeDefined()
  }, { timeout: 4000, interval: 100 })
})
```

---

## 4. Double Assertion: HTTP Contract + Persistent State

A complete integration test must perform a **Double Assertion**:

1. **HTTP Contract Assertion:**
   - Status code matches HTTP specification (201 Created, 400 Bad Request, 404 Not Found, 403 Forbidden)
   - Response headers (e.g., `Location`, `Content-Type: application/json`)
   - Response body matches expected schema (using `.toMatchObject()` for dynamic fields)
2. **Persistent Storage Assertion:**
   - Query the actual database (via Prisma, Drizzle, or raw SQL) to verify that records were created, updated, or soft-deleted
   - Verify related tables (e.g., did creating an order also decrement inventory in `inventory_items`?)

```typescript
it('registers user and persists record in database', async () => {
  const payload = {
    email: 'newuser@example.com',
    password: 'SecurePassword123!',
    name: 'Jane Doe',
  }

  // Act
  const res = await request(app).post('/api/auth/register').send(payload)

  // 1. Assert HTTP Contract
  expect(res.status).toBe(201)
  expect(res.body).toMatchObject({
    user: {
      email: 'newuser@example.com',
      name: 'Jane Doe',
    },
  })
  expect(res.body.user.password).toBeUndefined() // security contract: never leak password hash

  // 2. Assert Real Database State
  const dbUser = await prisma.user.findUnique({
    where: { email: 'newuser@example.com' },
  })
  expect(dbUser).not.toBeNull()
  expect(dbUser?.name).toBe('Jane Doe')
  expect(dbUser?.passwordHash).toBeDefined()
  expect(dbUser?.passwordHash).not.toBe(payload.password) // must be hashed
})
```
