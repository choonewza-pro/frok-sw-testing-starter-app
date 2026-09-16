# Test File & Directory Organization

As a project grows from a few functions to dozens of modules, organizing test files, test helpers, and test data becomes critical for maintainability and discovery.

---

## Core Strategies

### Strategy A: Co-located Tests (Recommended for Modern Projects)

Place the test file directly next to the source file it tests.

```
src/
├── services/
│   ├── order-service.ts
│   ├── order-service.test.ts       # Co-located unit test
│   ├── payment-service.ts
│   └── payment-service.test.ts     # Co-located unit test
└── utils/
    ├── format-price.ts
    └── format-price.test.ts        # Co-located unit test
```

**Why this is recommended (Vitest / Modern Jest):**
- **Instant discovery** — you see immediately whether a file has tests.
- **Easy refactoring** — moving, renaming, or deleting a source file moves its test along with it.
- **Relative imports are simple** — `import { formatPrice } from './format-price'`.
- **Prevents orphan tests** — tests don't get left behind when source files are deleted.

---

### Strategy B: Centralized `__tests__/` Directory

Place tests in a `__tests__` subfolder alongside the code or at package root.

```
src/
├── services/
│   ├── __tests__/
│   │   ├── order-service.test.ts
│   │   └── payment-service.test.ts
│   ├── order-service.ts
│   └── payment-service.ts
```

**When to use:**
- Projects with existing convention using `__tests__/`.
- When separating unit tests from integration tests (`tests/unit/`, `tests/integration/`).

---

## Organizing When a Module Grows Large

When a single service or module has dozens of behaviors, keeping all tests in one `foo.test.ts` leads to giant files (500+ lines) that are difficult to navigate.

### Approach: Split by Behavior / Sub-Feature

Break the test file into focused test files grouped under a test folder or named by feature:

```
src/services/order/
├── order-service.ts                # Main service
├── order-service.validation.test.ts # Focus: Input validation & boundaries
├── order-service.discount.test.ts   # Focus: VIP, coupon, cap logic
├── order-service.payment.test.ts    # Focus: Payment integration & errors
└── order-service.lifecycle.test.ts  # Focus: State transitions (pending → confirmed)
```

**Rule of thumb:** If a single test file exceeds ~300 lines or has more than 5 nested `describe` blocks, consider splitting by domain capability.

---

## Organizing Test Fixtures, Factories, and Helpers

Do NOT duplicate complex mock objects across multiple test files. Organize test utilities cleanly:

```
src/
├── test/                           # Shared test-only infrastructure
│   ├── factories/                  # Object builders / test data generators
│   │   ├── user.factory.ts         # createUser({ role: 'vip' })
│   │   └── order.factory.ts        # createOrder({ total: 1000 })
│   ├── mocks/                      # Reusable manual mocks
│   │   ├── mock-payment-gateway.ts
│   │   └── mock-logger.ts
│   └── setup.ts                    # Vitest/Jest global test setup
```

### Example: Factory Pattern for Clean Arrange Steps

```typescript
// src/test/factories/order.factory.ts
export function createTestOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-123',
    userId: 'user-456',
    items: [{ productId: 'p1', quantity: 1, price: 100 }],
    status: 'pending',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }
}

// In test file:
const vipOrder = createTestOrder({ items: [{ productId: 'p1', quantity: 10, price: 500 }] })
```

---

## Directory Organization Decision Matrix

| Project Size / Context | Recommended Structure | Pattern |
|---|---|---|
| **Small to Medium TS project** | Co-located `*.test.ts` next to source files | `src/utils/math.ts` + `src/utils/math.test.ts` |
| **Large Service with 20+ tests** | Split by sub-feature or behavior | `src/order/order.create.test.ts`, `order.cancel.test.ts` |
| **Shared test helpers / mocks** | Dedicated `src/test/` or `tests/helpers/` | `src/test/factories/`, `src/test/fixtures/` |
| **Existing Codebase Convention** | Follow the repository's existing pattern | Check existing test files before creating new ones |
