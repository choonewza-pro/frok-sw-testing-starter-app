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

Tests must produce the **same result** every time, on every machine.

- ✅ Mock `Date.now()`, random values, environment variables
- ❌ Depend on current time, network availability, OS locale

```typescript
// ✅ Good — deterministic time
vi.useFakeTimers()
vi.setSystemTime(new Date('2026-01-15T10:00:00Z'))

const result = getGreeting()
expect(result).toBe('Good morning')

vi.useRealTimers()
```

```typescript
// ❌ Bad — depends on actual system time
const result = getGreeting() // returns different things at 8am vs 8pm
expect(result).toBe('Good morning') // flaky!
```

### S — Self-Validating

Tests must have **explicit assertions** that produce pass/fail — no manual inspection.

- ✅ `expect(result).toBe(expected)`
- ❌ `console.log(result)` then human reads output

```typescript
// ✅ Good — clear assertion
expect(user.isActive).toBe(true)

// ❌ Bad — no assertion, just logging
console.log('User status:', user.isActive) // passes even if wrong!
```

Every test MUST have at least one `expect()` call. Tests with zero assertions are worse
than no tests because they give false confidence.

### T — Timely

Tests should be written **close to when the production code is written**.

- ✅ Write test alongside or before the implementation (TDD)
- ❌ Write tests weeks later as an afterthought

When an agent writes code, it should write the test in the same session, not defer it.

---

## Pre-Commit Quality Checklist

Run through this before considering tests complete:

```
□ Fast      — No real I/O, no network, no sleep/timeout
□ Isolated  — beforeEach clears all mocks, no shared mutable state
□ Repeatable — Time, random, and env are mocked where used
□ Self-Valid — Every it() block has at least one expect()
□ Timely    — Tests exist for all new/changed production code
```
