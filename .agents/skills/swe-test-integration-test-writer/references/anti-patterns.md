# Integration Test Anti-Patterns

Common mistakes that make integration tests slow, flaky, dangerous, or misleading.

---

## 1. Mocking Internal Services & Repositories (The "Fake" Integration Test)

**Problem:** Using `jest.mock()` or `vi.mock()` on your own database repositories or services inside an integration test.

```typescript
// ❌ ANTI-PATTERN — mocking the internal repository in an integration test
vi.mock('../src/repositories/user.repository', () => ({
  findUserById: vi.fn().mockResolvedValue({ id: 'u1', name: 'Alice' }),
}))

it('returns user profile', async () => {
  // This test did NOT verify if your SQL query works or if schema columns match!
  const res = await request(app).get('/api/users/u1')
  expect(res.status).toBe(200)
})

// ✅ BETTER — execute against the real database with unmocked repository
it('returns user profile from real database', async () => {
  const user = await createTestUser({ name: 'Alice' })

  const res = await request(app).get(`/api/users/${user.id}`)
  expect(res.status).toBe(200)
  expect(res.body.name).toBe('Alice')
})
```

---

## 2. Using `sleep()` or `setTimeout()` to Wait for Async Events

**Problem:** Guessing elapsed time with `sleep(3000)` causes massive flakiness in CI under heavy CPU load, and wastes minutes of build time.

```typescript
// ❌ ANTI-PATTERN — arbitrary sleep
await new Promise((r) => setTimeout(r, 2000))
const order = await prisma.order.findUnique({ where: { id: orderId } })
expect(order?.status).toBe('PROCESSED')

// ✅ BETTER — deterministic polling with waitFor()
await waitFor(async () => {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  expect(order?.status).toBe('PROCESSED')
}, { timeout: 4000, interval: 50 })
```

---

## 3. Shared Mutable Database State (Test Pollution)

**Problem:** Test B assumes records created in Test A are still present, or fails if Test A runs first.

```typescript
// ❌ ANTI-PATTERN — test B depends on test A running first
it('creates user', async () => {
  await request(app).post('/api/users').send({ email: 'john@example.com' })
})

it('fetches user', async () => {
  // FAILS if this test runs alone or in a different order!
  const res = await request(app).get('/api/users/john@example.com')
  expect(res.status).toBe(200)
})

// ✅ BETTER — each test creates its own independent data
it('fetches user', async () => {
  const user = await createTestUser()
  const res = await request(app).get(`/api/users/${user.email}`)
  expect(res.status).toBe(200)
})
```

---

## 4. Unclosed Database Pools & Sockets (CI Hangs)

**Problem:** Failing to disconnect Prisma, Drizzle, Redis, or HTTP servers in `afterAll` prevents the Node.js event loop from exiting.

```typescript
// ❌ ANTI-PATTERN — test suite hangs forever in CI
describe('API', () => {
  it('does work', async () => { ... })
  // Missing afterAll(() => prisma.$disconnect())
})

// ✅ BETTER — always cleanly close connections
afterAll(async () => {
  await prisma.$disconnect()
  if (server?.listening) await server.close()
})
```

---

## 5. Hardcoding Primary Keys & Unique Fields

**Problem:** Hardcoding `'user-1'` or `'test@example.com'` causes unique constraint crashes when tests run concurrently or repeatedly.

```typescript
// ❌ ANTI-PATTERN — hardcoded ID collisions
const user = await prisma.user.create({ data: { id: 'user-1', email: 'a@a.com' } })

// ✅ BETTER — use dynamic, collision-free factory values
const user = await createTestUser() // Generates random UUID and unique email
```

---

## 6. Running Against Staging or Production Databases

**Problem:** Missing safety guards allows an accidental `DATABASE_URL` leak to drop tables or pollute real company databases.

```typescript
// ❌ ANTI-PATTERN — no check
beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE users CASCADE;') // Drops prod DB!
})

// ✅ BETTER — assert test environment first
beforeAll(() => {
  assertSafeTestEnvironment() // Throws immediately if NODE_ENV !== 'test'
})
```

---

## 7. Testing 20 Combinatorial Branches in Integration Tests

**Problem:** Writing 20 integration tests to test discount percentage rounding (takes 10 seconds).

- **Rule:** Test the 20 rounding math permutations in a **1ms Unit Test**.
- Test only 1–2 integration cases to prove that the discount correctly saves to the database table.

---

## 8. Ignoring Multi-Worker Concurrency

**Problem:** Running parallel test workers (`vitest`) against a single shared test schema causes random truncation clashes.

- **Solution:** Run integration tests with `--no-threads` / `--runInBand`, or assign isolated database schemas per worker.

---

## 9. Verifying Only HTTP Status Without Database Verification

**Problem:** Checking `expect(res.status).toBe(200)` and assuming everything succeeded, while the database write actually failed or corrupted data silently.

- **Solution:** Always query the real database to confirm records were created or modified as expected.

---

## 10. Making Real Network Calls to External 3rd-Party APIs

**Problem:** Calling live Stripe, Twilio, or SendGrid APIs during integration tests (incurs real costs, triggers real emails/SMS, and fails if offline).

- **Solution:** Intercept outgoing network traffic at the socket boundary using **MSW (`msw/node`)**.

---

## 11. Missing `await` on Async Assertions (Floating Promise)

**Problem:**
```typescript
// ❌ Silently passes even if the request rejects!
expect(request(app).get('/api/error')).rejects.toThrow()

// ✅ Properly awaited
await expect(request(app).get('/api/error')).rejects.toThrow()
```

---

## 12. Brittle Full-Object `.toEqual()` on Generated Fields

**Problem:** Asserting `expect(res.body).toEqual({ id: '123', createdAt: '...', ... })` breaks whenever timestamp precision or UUID formats change.

- **Solution:** Use `.toMatchObject()` for stable business properties and `expect.any(String)` for generated IDs.

---

## Quick Checklist

```
□ No internal services or repositories are mocked with vi.mock() or jest.mock()
□ No sleep() or setTimeout() calls are used (polling via waitFor() instead)
□ Each test seeds its own independent data via Factory functions (no hardcoded IDs)
□ Clean database truncate/rollback runs before or after each test (no test pollution)
□ All DB connection pools and servers are closed in afterAll (no CI hang)
□ Safety guard verifies NODE_ENV === 'test' and safe DATABASE_URL
□ External 3rd-party APIs (Stripe, SMS) are mocked at the network level via MSW
□ Tests verify both HTTP response AND real persistent database changes
□ Asynchronous promises are properly awaited (no floating promises)
□ Multi-worker concurrency collisions are prevented (--no-threads or schema-per-worker)
```
