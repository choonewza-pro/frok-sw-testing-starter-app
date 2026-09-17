# Integration Test Naming Conventions

Standardized naming rules for integration test files, suites, and cases for crystal-clear CI diagnostics.

---

## 1. File Extension Standards

Never name integration test files `*.test.ts` without distinction, or Jest/Vitest will accidentally run them during rapid unit test cycles.

| Suffix | Purpose | Example |
|---|---|---|
| `*.integration.test.ts` | Recommended default for all integration tests | `order-checkout.integration.test.ts` |
| `*.int.spec.ts` | Alternative common in NestJS / Angular enterprise repos | `auth.int.spec.ts` |
| `*.integration.ts` | Minimalist suffix | `billing.integration.ts` |

### Why this matters:
Allows simple glob separation in `package.json`:
- `npm run test:unit` → targets `**/*.test.ts` (excluding `*.integration.*`)
- `npm run test:integration` → targets `**/*.integration.test.ts`

---

## 2. Suite (`describe`) Naming Patterns

Group suites logically by **Endpoint + Method** or **Domain Flow**:

### Pattern A: REST API Endpoints (Recommended)
```typescript
describe('POST /api/v1/orders (Checkout Flow)', () => {
  describe('when user is authenticated', () => {
    // ...
  })

  describe('when payload is invalid', () => {
    // ...
  })
})
```

### Pattern B: Event / Queue Handlers
```typescript
describe('Worker: ProcessPaymentJob (Queue Consumer)', () => {
  // ...
})
```

---

## 3. Case (`it` / `test`) Naming Patterns

A great test name follows **Given-When-Then** or **Action-Result** phrasing. An engineer looking at a red CI log should immediately know what broke without opening the test code.

### ✅ Clear, Descriptive Names:
- `returns 201 and persists order in DB when cart is valid`
- `returns 400 with VALIDATION_ERROR when quantity is negative`
- `returns 401 Unauthorized when Bearer token is missing`
- `returns 409 Conflict when user email is already registered`
- `rolls back transaction and restores inventory when payment fails`

### ❌ Anti-Pattern Names:
- `test 1` (says nothing)
- `should work` (vague)
- `calls repository.save` (testing implementation detail, not integration outcome)
- `handles orders and sends email and charges card` ("And Smell" — split into distinct tests)

---

## 4. CI Diagnostic Readability

When tests fail in a terminal or GitHub Actions pipeline, the output is printed as:

```
FAIL  src/modules/orders/checkout.integration.test.ts
  POST /api/v1/orders (Checkout Flow)
    when user is authenticated
      ✕ returns 201 and persists order in DB when cart is valid (184 ms)
```

Notice how the combined path:
`POST /api/v1/orders > when user is authenticated > returns 201 and persists order in DB when cart is valid`
tells you the exact failure location, condition, and expectation immediately.
