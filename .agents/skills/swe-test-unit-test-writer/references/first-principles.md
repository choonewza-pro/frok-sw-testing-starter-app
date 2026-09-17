# FIRST Principles

Quality checklist for unit tests that are maintainable long-term.

---

## The Five Principles

### F — Fast

Tests must run in **milliseconds**, not seconds.

- ✅ Pure function calls, in-memory mocks
- ❌ Real database queries, HTTP calls, file I/O, `setTimeout`

If a test needs a real database or API, it's an **integration test**, not a unit test.

```typescript
// ✅ Fast — mock returns immediately
mockPaymentGateway.charge.mockResolvedValue({ status: 'success' })

// ❌ Slow — real API call
const result = await stripe.charges.create({ amount: 1000 }) // NEVER in unit test
```

### I — Independent / Isolated

Each test must run **without depending on** any other test.

- ✅ Each test sets up its own data
- ❌ Test B depends on state left by Test A
- ❌ Tests share mutable variables without reset

```typescript
// ✅ Good — each test is self-contained
beforeEach(() => {
  vi.clearAllMocks()
})

it('test A', () => {
  mockService.getData.mockReturnValue([1, 2, 3])
  // ... test logic
})

it('test B', () => {
  mockService.getData.mockReturnValue([]) // sets up its own data
  // ... test logic
})
```

```typescript
// ❌ Bad — shared mutable state
let items: number[] = []

it('test A adds items', () => {
  items.push(1, 2, 3)
  expect(items).toHaveLength(3)
})

it('test B depends on A', () => {
  expect(items).toHaveLength(3) // FAILS if A doesn't run first
})
```

### R — Repeatable

Tests must produce the **same result** every time, on every machine, in any execution order.

- ✅ Mock `Date.now()`, random values, environment variables
- ✅ Always restore modified `process.env` in `afterEach`
- ❌ Depend on current time, network availability, OS locale, or un-reset env state

```typescript
// ✅ Good — deterministic time
vi.useFakeTimers()
vi.setSystemTime(new Date('2026-01-15T10:00:00Z'))

const result = getGreeting()
expect(result).toBe('Good morning')

vi.useRealTimers()
```

```typescript
// ✅ Good — isolated process.env
const originalEnv = process.env

beforeEach(() => {
  process.env = { ...originalEnv }
})

afterEach(() => {
  process.env = originalEnv
})
```

```typescript
// ❌ Bad — depends on actual system time or leaks env mutation
const result = getGreeting() // returns different things at 8am vs 8pm
expect(result).toBe('Good morning') // flaky!
```

### S — Self-Validating

Tests must have **explicit, precise assertions** that produce a clear pass/fail — no manual inspection and no false confidence.

- ✅ Precise assertions: `expect(user.role).toBe('admin')`
- ✅ Resilient object matching: `expect(result).toMatchObject({ status: 'active' })`
- ✅ Awaited async assertions: `await expect(fetchData()).rejects.toThrow(ApiError)`
- ❌ Weak assertions: `expect(result).toBeDefined()` (passes even if data is totally wrong)
- ❌ Floating promises: `expect(fetchData()).rejects.toThrow()` (missing `await` → silent pass!)
- ❌ Logging without assertion: `console.log('User status:', user.isActive)`

```typescript
// ❌ Bad — weak assertions (gives false confidence)
expect(result).toBeDefined()
expect(result).toBeTruthy()

// ❌ Bad — floating promise (never awaits, always passes!)
expect(fetchUserData('invalid')).rejects.toThrow()

// ✅ Good — precise and awaited
await expect(fetchUserData('invalid')).rejects.toThrow(UserNotFoundError)
expect(user).toMatchObject({
  id: 'u1',
  role: 'admin',
})
```

> 💡 **The Coverage Illusion (Coverage ≠ Confidence):**
> Code Coverage 100% ไม่ได้หมายความว่าระบบไม่มีบั๊ก! หากเขียน Test ที่รันผ่านบรรทัดโค้ดแต่ไม่มี Assertion หรือ Assertion หละหลวม (Dummy / Assertion-free test) จะทำให้ได้ตัวเลข Coverage สวยงามแต่ไม่มีคุณค่าในการดักจับ Bug ใน Production

Every test MUST have at least one meaningful `expect()` call.

### T — Timely

Tests should be written **close to when the production code is written**.

- ✅ Write test alongside or before the implementation (TDD)
- ❌ Write tests weeks later as an afterthought

When an agent writes code, it should write the test in the same session, not defer it.

---

## Pre-Commit Quality Checklist

Run through this before considering tests complete:

```
□ Fast        — No real I/O, no network, no sleep/timeout
□ Isolated    — beforeEach clears all mocks, process.env restored in afterEach
□ Repeatable  — Time, random, and env are mocked and deterministic
□ Self-Valid  — Precise assertions (no weak toBeTruthy(), no un-awaited rejects, no dummy coverage)
□ Resilient   — Uses toMatchObject/objectContaining for dynamic fields, checks Error Class/Code
□ Timely      — Tests exist for all new/changed production code
```
