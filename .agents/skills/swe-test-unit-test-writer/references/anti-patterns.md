# Anti-Patterns

Common mistakes that make unit tests fragile, misleading, or useless.

---

## 1. Testing Implementation Details

**Problem:** Test breaks when you refactor internals, even though behavior is unchanged.
- ไม่จำเป็นต้อง test ว่า function เรียก internal API แบบไหน
- **ห้าม test intermediate variable** (ตัวแปรภายในระหว่างทางของ implementation)
- ไม่ควรผูก test กับโครงสร้างหรือ private methods ภายในมากเกินไป

> 💡 **The Refactor Litmus Test (คำถามเช็คเด็ด):**
> *"ถ้าเรา Refactor Implementation ภายใน แต่ Output และ Behavior ภายนอกยังเหมือนเดิมทุกประการ Test นี้ควร Fail หรือไม่?"*
> - ถ้าคำตอบคือ **"Fail"** → แสดงว่ากำลัง Test Implementation Detail ไม่ใช่ Behavior! Test ที่ดีต้องยังคงผ่าน (Green) ตราบใดที่ Contract ยังเหมือนเดิม

```typescript
// ❌ Anti-pattern — asserting on internal method calls & intermediate variables
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

// ✅ Better — assert on the behavior / output / contract
it('returns order with confirmed status', async () => {
  const order = await createOrder(items, 'user-1')
  
  expect(order.status).toBe('confirmed')
  expect(order.totalPrice).toBe(1000)
})
```

**Rule of thumb:** If you rename an internal variable or refactor internal steps and the test breaks, you're testing implementation.

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

### The "And Smell" in Test Names
สังเกตง่ายๆ จากชื่อ Test: ถ้าชื่อ Test มีคำว่า **"and"** หลายครั้ง มักเป็นสัญญาณว่ากำลังตรวจหลายเรื่องใน Test เดียว

```typescript
// ❌ Anti-pattern — มี "and" หลายคำ รวมหลาย behavior
it('formats price and handles errors and logs result', () => { ... })

// ✅ Better — แยกเป็น 1 test ต่อ 1 behavior
it('formats USD price correctly', () => { ... })
it('throws when currency is invalid', () => { ... })
it('logs formatting error', () => { ... })
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

## 9. Missing `await` on Async Assertions (Floating Promise / Silent Pass)

**Problem:** Forgetting `await` before an async assertion (`expect().rejects...`) causes the assertion promise to be ignored. The test finishes before assertion executes, resulting in a **False Positive (Silent Pass)** or unhandled rejection errors in CI.

```typescript
// ❌ Anti-pattern — missing await before expect().rejects
it('should throw error on invalid input', () => {
  // This test passes even if createOrder never throws, or throws a completely different error!
  expect(createOrder(invalidItems)).rejects.toThrow(InvalidInputError)
})

// ✅ Better — always await async assertions
it('should throw error on invalid input', async () => {
  await expect(createOrder(invalidItems)).rejects.toThrow(InvalidInputError)
})
```

**Rule of thumb:** If the function under test returns a Promise, any assertion on `.rejects` or `.resolves` MUST have `await expect(...)`.

---

## 10. Weak Assertions & Brittle Over-Asserting

**Problem:**
- **Weak Assertions:** Asserting only existence (`.toBeDefined()`, `.toBeTruthy()`) gives a false sense of security. The object might exist but contain completely corrupt data.
- **Brittle Over-Asserting:** Asserting entire objects with `.toEqual()` when objects contain auto-generated timestamps, random UUIDs, or unrelated metadata causes tests to break whenever non-critical fields change.

```typescript
// ❌ Anti-pattern A (Too weak) — passes even if payload is wrong
it('should return user profile', async () => {
  const profile = await getUserProfile('u1')
  expect(profile).toBeDefined()
  expect(profile.data).toBeTruthy()
})

// ❌ Anti-pattern B (Too brittle) — breaks whenever createdAt or id format changes
it('should create user', async () => {
  const user = await createUser({ name: 'Alice' })
  expect(user).toEqual({
    id: 'uuid-1234',
    name: 'Alice',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    version: 1,
  })
})

// ✅ Better — assert critical behavior and contract with partial matchers
it('should create user with valid profile', async () => {
  const user = await createUser({ name: 'Alice' })
  expect(user).toMatchObject({
    name: 'Alice',
    isActive: true,
  })
  expect(user.id).toEqual(expect.any(String))
})
```

---

## 11. Testing Exact Error Message Strings (Fragile Error Matching)

**Problem:** Asserting on exact string messages (`toThrow('User email is already registered in our system')`) makes tests fragile. Minor copy tweaks, localization, or punctuation edits break the test suite even though business logic is unchanged.

```typescript
// ❌ Anti-pattern — coupled to exact phrasing
it('should reject duplicate email', async () => {
  await expect(registerUser({ email: 'existing@test.com' }))
    .rejects.toThrow('User email is already registered in our system.')
})

// ✅ Better — assert by Custom Error Class or Error Code
it('should reject duplicate email with DuplicateUserError', async () => {
  await expect(registerUser({ email: 'existing@test.com' }))
    .rejects.toThrow(DuplicateUserError)
})

// ✅ Better — assert error code or structured properties
it('should return DUPLICATE_EMAIL error code', async () => {
  await expect(registerUser({ email: 'existing@test.com' }))
    .rejects.toMatchObject({
      code: 'ERR_DUPLICATE_EMAIL',
    })
})
```

---

## 12. Polluting Global State & `process.env` without Cleanup

**Problem:** Mutating `process.env` or global objects inside a test without restoring original values leaks state into subsequent tests, creating unpredictable and flaky test runs.

```typescript
// ❌ Anti-pattern — modifies process.env directly with no cleanup
it('should enable debug mode when env is set', () => {
  process.env.DEBUG = 'true'
  expect(isDebugEnabled()).toBe(true)
  // DEBUG remains 'true' for all tests running after this!
})

// ✅ Better — snapshot and restore in beforeEach/afterEach
describe('isDebugEnabled', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should enable debug mode when env is set', () => {
    process.env.DEBUG = 'true'
    expect(isDebugEnabled()).toBe(true)
  })
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
□ Every it() block has at least one expect() (no dummy coverage or assertion-free tests)
□ All async assertions on promises have `await expect(...).rejects` (no floating promises)
□ Assertions verify specific values, not just `.toBeDefined()` or `.toBeTruthy()`
□ Object assertions use `.toMatchObject()` or `expect.objectContaining()` for dynamic fields
□ Error tests assert Custom Error classes or Error Codes, NOT brittle wording strings
□ Any mutations to `process.env` or global state are restored in afterEach
□ No large snapshot assertions (use field-level assertions instead)
□ Negative, error, and edge cases are covered — not just happy path
```
