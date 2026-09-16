# Anti-Patterns

Common mistakes that make unit tests fragile, misleading, or useless.

---

## 1. Testing Implementation Details

**Problem:** Test breaks when you refactor internals, even though behavior is unchanged.

```typescript
// ❌ Anti-pattern — asserting on internal method calls
it('should call repository.save with correct data', async () => {
  await createOrder(items, 'user-1')
  
  expect(mockRepo.save).toHaveBeenCalledWith({
    items,
    userId: 'user-1',
    createdAt: expect.any(Date),
    status: 'pending',
    internalTrackingId: expect.any(String), // testing internal detail!
  })
})

// ✅ Better — assert on the behavior / output
it('should return order with confirmed status', async () => {
  const order = await createOrder(items, 'user-1')
  
  expect(order.status).toBe('confirmed')
  expect(order.totalPrice).toBe(1000)
})
```

**Rule of thumb:** If you rename an internal variable and the test breaks, you're testing implementation.

---

## 2. Over-Mocking

**Problem:** When everything is mocked, the test verifies mock behavior, not real code.

```typescript
// ❌ Anti-pattern — mock everything
vi.mock('./utils')
vi.mock('./config')
vi.mock('./logger')
vi.mock('./validator')
vi.mock('./formatter')

it('should process data', () => {
  // This test is running against 5 mocks and 0 real code
  const result = processData(input)
  expect(result).toBe(mockOutput) // You're testing the mock!
})

// ✅ Better — mock only external deps, let internal logic run
vi.mock('./external-api') // only the external dependency

it('should process and format data from external API', () => {
  mockApi.fetch.mockResolvedValue(rawData)
  
  const result = processData(input)
  
  // formatter, validator, and utils actually run → real coverage
  expect(result.formatted).toBe(true)
})
```

**Rule of thumb:** If you have more `vi.mock()` calls than `expect()` calls, something is wrong.

---

## 3. Multiple Acts in One Test

**Problem:** When a test fails, you don't know which behavior broke.

```typescript
// ❌ Anti-pattern — testing multiple behaviors
it('should handle order lifecycle', async () => {
  const order = await createOrder(items, 'user-1')     // Act 1
  expect(order.status).toBe('pending')
  
  const paid = await processPayment(order.id)           // Act 2
  expect(paid.status).toBe('paid')
  
  const shipped = await shipOrder(order.id)              // Act 3
  expect(shipped.status).toBe('shipped')
})

// ✅ Better — one test per behavior
it('should create order with pending status', async () => {
  const order = await createOrder(items, 'user-1')
  expect(order.status).toBe('pending')
})

it('should set status to paid after successful payment', async () => {
  const paid = await processPayment('order-1')
  expect(paid.status).toBe('paid')
})

it('should set status to shipped after shipping', async () => {
  const shipped = await shipOrder('order-1')
  expect(shipped.status).toBe('shipped')
})
```

---

## 4. Copy-Paste Tests

**Problem:** 10 tests that differ only by one input value → maintenance nightmare.

```typescript
// ❌ Anti-pattern — copy-pasted tests
it('should validate age 17 as invalid', () => {
  expect(() => validateAge(17)).toThrow()
})
it('should validate age 18 as valid', () => {
  expect(() => validateAge(18)).not.toThrow()
})
it('should validate age 60 as valid', () => {
  expect(() => validateAge(60)).not.toThrow()
})
it('should validate age 61 as invalid', () => {
  expect(() => validateAge(61)).toThrow()
})

// ✅ Better — table-driven
it.each([
  { age: 17, valid: false, label: 'below min' },
  { age: 18, valid: true,  label: 'exactly min' },
  { age: 60, valid: true,  label: 'exactly max' },
  { age: 61, valid: false, label: 'above max' },
])('should validate age $age as $label', ({ age, valid }) => {
  if (valid) {
    expect(() => validateAge(age)).not.toThrow()
  } else {
    expect(() => validateAge(age)).toThrow(InvalidAgeError)
  }
})
```

---

## 5. Tests That Depend on Execution Order

**Problem:** Test B passes only if Test A runs first.

```typescript
// ❌ Anti-pattern — shared mutable state
let userId: string

it('should create user', async () => {
  const user = await createUser({ name: 'Test' })
  userId = user.id // saved for next test
})

it('should find created user', async () => {
  const user = await findUser(userId) // depends on test above!
  expect(user.name).toBe('Test')
})

// ✅ Better — each test sets up its own data
it('should find user when user exists', async () => {
  mockUserRepo.findById.mockResolvedValue(createUser({ id: 'u1', name: 'Test' }))
  
  const user = await findUser('u1')
  expect(user.name).toBe('Test')
})
```

---

## 6. No Assertions (Silent Test)

**Problem:** Test always passes because it never asserts anything.

```typescript
// ❌ Anti-pattern — no expect()
it('should process data', async () => {
  const result = await processData(input)
  console.log(result) // human has to read this
})

// ✅ Better
it('should process data and return formatted output', async () => {
  const result = await processData(input)
  expect(result.formatted).toBe(true)
  expect(result.itemCount).toBe(3)
})
```

---

## 7. Snapshot Abuse

**Problem:** Snapshotting large objects without reviewing them → rubber-stamp tests.

```typescript
// ❌ Anti-pattern — snapshot of entire response
it('should return user data', async () => {
  const result = await getUser('u1')
  expect(result).toMatchSnapshot() // 200-line snapshot nobody reads
})

// ✅ Better — assert on specific fields
it('should return user with correct fields', async () => {
  const result = await getUser('u1')
  expect(result.id).toBe('u1')
  expect(result.role).toBe('member')
  expect(result.isActive).toBe(true)
})

// ✅ OK — small, intentional inline snapshot
it('should return error shape', () => {
  const error = createError('NOT_FOUND', 'User not found')
  expect(error).toMatchInlineSnapshot(`
    {
      "code": "NOT_FOUND",
      "message": "User not found",
    }
  `)
})
```

---

## 8. Testing Only Happy Path

**Problem:** 100% of tests pass in dev, 80% of production bugs come from unhandled edge cases.

```typescript
// ❌ Anti-pattern — only positive cases
describe('createOrder', () => {
  it('should create order with 1 item', () => { ... })
  it('should create order with 2 items', () => { ... })
  it('should create order with coupon', () => { ... })
  // 0 negative cases, 0 error cases, 0 edge cases!
})

// ✅ Better — balanced coverage
describe('createOrder', () => {
  // Happy path
  it('should create order with valid items', () => { ... })
  
  // Negative
  it('should reject empty cart', () => { ... })
  it('should reject invalid quantity', () => { ... })
  
  // Error
  it('should handle database failure gracefully', () => { ... })
  
  // Edge
  it('should handle null coupon code', () => { ... })
})
```

---

## Quick Checklist

Before submitting test code, verify none of these anti-patterns are present:

```
□ No test asserts on internal method names or call counts (unless it IS the behavior)
□ No more mock declarations than actual assertions
□ Each it() block has exactly one Act phase
□ No copy-pasted tests that should be it.each
□ No shared mutable state between tests
□ Every it() block has at least one expect()
□ No large snapshot assertions (use field-level assertions instead)
□ Negative, error, and edge cases are covered — not just happy path
```
