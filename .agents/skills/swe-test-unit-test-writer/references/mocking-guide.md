# Mocking Guide

How to properly isolate dependencies in TypeScript unit tests.

---

## Core Principle

> Mock เฉพาะ **external dependencies** — อย่า mock function ที่กำลัง test
>
> Over-mocking = testing the mocks, not the code

---

## What to Mock vs What NOT to Mock

| Mock ✅ | Don't Mock ❌ |
|---------|--------------|
| Database repositories / ORM | The function under test |
| External APIs (Stripe, SendGrid) | Pure utility functions (formatDate, etc.) |
| File system operations | Simple data transformations |
| Email/SMS services | TypeScript types and interfaces |
| Third-party SDKs | Constants and enums |
| System clock (`Date.now()`) | |
| Random values (`Math.random()`) | |

---

## Module Mocking

### Vitest

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createOrder } from './order-service'
import { OrderRepository } from './order-repository'
import { PaymentGateway } from './payment-gateway'

// Mock entire modules at top level
vi.mock('./order-repository')
vi.mock('./payment-gateway')

describe('createOrder', () => {
  // Get typed mock references
  const mockOrderRepo = vi.mocked(OrderRepository)
  const mockPaymentGateway = vi.mocked(PaymentGateway)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should save order and charge payment', async () => {
    // Arrange — configure mock return values
    mockOrderRepo.prototype.save.mockResolvedValue({ id: 'order-1' })
    mockPaymentGateway.prototype.charge.mockResolvedValue({ status: 'success' })

    // Act
    const result = await createOrder(validItems, 'user-1')

    // Assert
    expect(result.id).toBe('order-1')
    expect(mockPaymentGateway.prototype.charge).toHaveBeenCalledWith({
      amount: 1000,
      userId: 'user-1',
    })
  })
})
```

### Jest

```typescript
import { createOrder } from './order-service'
import { OrderRepository } from './order-repository'
import { PaymentGateway } from './payment-gateway'

// Mock entire modules at top level
jest.mock('./order-repository')
jest.mock('./payment-gateway')

describe('createOrder', () => {
  const mockOrderRepo = jest.mocked(OrderRepository)
  const mockPaymentGateway = jest.mocked(PaymentGateway)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ... same test structure as Vitest
})
```

---

## Function Mocking

### Mock a standalone function

```typescript
// Vitest
const mockCalculateTax = vi.fn()
vi.mock('./tax-calculator', () => ({
  calculateTax: mockCalculateTax,
}))

// Jest
const mockCalculateTax = jest.fn()
jest.mock('./tax-calculator', () => ({
  calculateTax: mockCalculateTax,
}))
```

### Spy on an object method

```typescript
// Vitest
const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

// Jest
const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

// Assert it was called
expect(spy).toHaveBeenCalledWith('Something went wrong')

// Restore original
spy.mockRestore()
```

---

## Mock Return Values

```typescript
// Return a value
mockFn.mockReturnValue(42)

// Return a value once (useful for sequential calls)
mockFn.mockReturnValueOnce(1).mockReturnValueOnce(2).mockReturnValue(3)

// Async — resolve
mockFn.mockResolvedValue({ data: 'success' })

// Async — reject
mockFn.mockRejectedValue(new Error('Connection refused'))

// Custom implementation
mockFn.mockImplementation((input) => {
  if (input > 100) return 'large'
  return 'small'
})
```

---

## Timer Mocking

For code that uses `setTimeout`, `setInterval`, or `Date.now()`:

```typescript
// Vitest
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-15T10:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

it('should expire session after 30 minutes', () => {
  const session = createSession()
  
  // Fast-forward 30 minutes
  vi.advanceTimersByTime(30 * 60 * 1000)
  
  expect(session.isExpired()).toBe(true)
})
```

```typescript
// Jest
beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(new Date('2026-01-15T10:00:00Z'))
})

afterEach(() => {
  jest.useRealTimers()
})
```

---

## Dependency Injection Pattern

The cleanest way to mock: inject dependencies instead of importing them.

```typescript
// production code — accepts dependencies as parameters
export function createOrderService(
  orderRepo: OrderRepository,
  paymentGateway: PaymentGateway,
) {
  return {
    async createOrder(items: Item[], userId: string) {
      const order = await orderRepo.save({ items, userId })
      await paymentGateway.charge({ amount: order.total, userId })
      return order
    },
  }
}

// test — inject mocks directly, no vi.mock() needed
it('should create order and charge payment', async () => {
  // Arrange
  const mockRepo = { save: vi.fn().mockResolvedValue({ id: 'o1', total: 1000 }) }
  const mockPayment = { charge: vi.fn().mockResolvedValue({ status: 'ok' }) }
  const service = createOrderService(mockRepo as any, mockPayment as any)

  // Act
  const result = await service.createOrder(validItems, 'user-1')

  // Assert
  expect(result.id).toBe('o1')
  expect(mockPayment.charge).toHaveBeenCalledWith({ amount: 1000, userId: 'user-1' })
})
```

This pattern is **preferred** because:
- No module-level `vi.mock()` magic
- Tests are more explicit about what's mocked
- Easier to test different mock configurations per test

---

## Common Mock Assertions

```typescript
// Was called?
expect(mockFn).toHaveBeenCalled()

// Called exactly N times?
expect(mockFn).toHaveBeenCalledTimes(1)

// Called with specific args?
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')

// Called with partial match?
expect(mockFn).toHaveBeenCalledWith(
  expect.objectContaining({ userId: 'user-1' })
)

// Never called?
expect(mockFn).not.toHaveBeenCalled()

// Call order (across multiple mocks)?
expect(mockA).toHaveBeenCalledBefore(mockB) // Jest only
```

---

## Anti-Patterns in Mocking

```typescript
// ❌ Mocking the function under test
vi.mock('./discount-service')
const result = calculateDiscount(100, 'vip') // you're testing the MOCK

// ❌ Mocking pure utility functions
vi.mock('./utils/format-date') // just let it run, it has no side effects

// ❌ Over-mocking everything
vi.mock('./logger')
vi.mock('./config')
vi.mock('./utils')
vi.mock('./types')  // types don't need mocking!
// If you mock 5+ modules, your test is testing nothing real

// ❌ Not resetting mocks between tests
// Missing beforeEach(() => vi.clearAllMocks())
// → tests pollute each other's mock state
```
