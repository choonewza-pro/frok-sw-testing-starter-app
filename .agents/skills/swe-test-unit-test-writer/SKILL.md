---
name: swe-test-unit-test-writer
description: >
  Guides AI agents to write high-quality TypeScript unit tests using Jest or
  Vitest. Covers Arrange-Act-Assert pattern, FIRST principles, scenario design
  (happy/negative/error/boundary), mocking strategies, naming conventions, and
  anti-patterns. Use when the user asks to "write unit tests", "เขียน test",
  "เพิ่ม test", "สร้าง test file", or when an agent needs to produce .test.ts
  or .spec.ts files. Focused on unit tests only — for integration tests, use a
  dedicated integration test skill.
license: Apache-2.0
allowed-tools: ReadFile, ListDirectory, RunCommand, WriteFile
metadata:
  author: choonewza
  version: "0.1"
---

## Overview

You are a unit test writer for **TypeScript** projects using **Jest** or **Vitest**.

Your job is to produce `.test.ts` / `.spec.ts` files that are:
- **Readable** — anyone can understand the business rule from the test name alone
- **Reliable** — follows FIRST principles (Fast, Independent, Repeatable, Self-Validating, Timely)
- **Comprehensive** — covers happy path, negative path, error cases, and boundary cases
- **Maintainable** — uses Arrange–Act–Assert, proper mocking, and avoids anti-patterns

> Unit Test ตรวจพฤติกรรมของ function, module หรือ class ขนาดเล็ก ในสถานการณ์ที่ควบคุมได้
> เป้าหมายคือ **confidence** ไม่ใช่จำนวน test case เยอะที่สุด

**Scope:** Unit tests only. This skill does NOT cover integration tests, E2E tests,
or API tests. For test case *design* (BVA/EP/STT), use `swe-test-engineer`.
For test *prioritization*, use `swe-test-planner`.

For detailed references, see:
- [references/aaa-pattern.md](references/aaa-pattern.md) — Arrange–Act–Assert structure
- [references/first-principles.md](references/first-principles.md) — quality checklist
- [references/scenario-design.md](references/scenario-design.md) — how to think about scenarios
- [references/case-types.md](references/case-types.md) — positive / negative / error / boundary
- [references/mocking-guide.md](references/mocking-guide.md) — dependency isolation (jest.mock, vi.mock)
- [references/naming-conventions.md](references/naming-conventions.md) — test naming patterns
- [references/anti-patterns.md](references/anti-patterns.md) — common mistakes to avoid
- [references/examples.md](references/examples.md) — complete worked examples

---

## When to Activate

Activate when the user:

- Asks to write unit tests for a function, module, or class
- Says "เขียน test", "เพิ่ม test", "สร้าง test file", "write unit tests"
- Has a `.ts` file and wants test coverage
- Asks to improve existing test quality or refactor tests
- Mentions Jest, Vitest, or test-related TypeScript work

Do NOT activate when:
- The user wants integration tests or E2E tests → separate skill
- The user wants test case *design* (BVA/EP tables) → use `swe-test-engineer`
- The user wants test *prioritization* → use `swe-test-planner`
- The code is not TypeScript (Python, Go, etc.) → this skill is TS-specific

---

## Anti-Patterns

Before writing any test, internalize these rules. See [references/anti-patterns.md](references/anti-patterns.md) for details.

- ❌ **Do not test implementation details** — test behavior, not internal method calls
- ❌ **Do not mock everything** — over-mocking means you're testing the mocks, not the code
- ❌ **Do not use generic test names** — "test case 1", "should work" are forbidden
- ❌ **Do not have multiple Act steps in one test** — one behavior per test
- ❌ **Do not copy-paste tests that differ only by data** — use `it.each` / `test.each`
- ❌ **Do not write tests that depend on execution order** — each test must be independent
- ❌ **Do not assert on snapshot without reviewing it** — snapshots must be intentional
- ❌ **Do not skip error and edge cases** — these have the highest production value

---

## Instructions

### Step 1: Detect Test Framework

Check the project to determine Jest or Vitest:

| Signal | Framework |
|--------|-----------|
| `jest.config.ts` / `jest.config.js` | Jest |
| `vitest.config.ts` / `vite.config.ts` with `test:` block | Vitest |
| `package.json` → `devDependencies` contains `jest` | Jest |
| `package.json` → `devDependencies` contains `vitest` | Vitest |
| Import from `vitest` in existing test files | Vitest |

**Key differences to remember:**

| Feature | Jest | Vitest |
|---------|------|--------|
| Mock module | `jest.mock('./module')` | `vi.mock('./module')` |
| Mock function | `jest.fn()` | `vi.fn()` |
| Spy | `jest.spyOn(obj, 'method')` | `vi.spyOn(obj, 'method')` |
| Timer mock | `jest.useFakeTimers()` | `vi.useFakeTimers()` |
| Reset | `jest.clearAllMocks()` | `vi.clearAllMocks()` |
| Globals | `describe/it/expect` auto-global | Must set `globals: true` or import from `vitest` |

If both are present, prefer Vitest (it's the newer standard).
If neither is found, ask the user via the tool which framework to use.

---

### Step 2: Analyze the Source Code

Before writing any test, **read and understand** the source code:

1. **Read the target file** — understand every function, its inputs, outputs, and side effects
2. **Identify dependencies** — what does this module import? Which need mocking?
3. **Identify business rules** — what conditions, branches, and edge cases exist?
4. **Check for existing tests** — avoid duplicating what's already tested

Build a mental map:
```
Function: calculateDiscount(price, userRole, couponCode)
├── Inputs: price (number), userRole (enum), couponCode (string | null)
├── Output: { finalPrice: number, discountApplied: boolean }
├── Dependencies: CouponService.validate() ← needs mock
├── Business rules:
│   ├── price < 0 → throw InvalidPriceError
│   ├── userRole "vip" → 20% discount
│   ├── userRole "member" → 10% discount
│   ├── userRole "guest" → 0% discount
│   ├── valid coupon → additional 5% off
│   └── discount cap at 50% max
└── Edge cases: price = 0, coupon expired, unknown role
```

---

### Step 3: Design Test Scenarios

For each function, design scenarios BEFORE writing code.
See [references/scenario-design.md](references/scenario-design.md) and [references/case-types.md](references/case-types.md).

For each business rule, think through:

| Type | Question | Example |
|------|----------|---------|
| **Happy path** | What happens when everything is correct? | VIP user with valid coupon gets 25% off |
| **Negative path** | What should the system reject? | Negative price → throw error |
| **Error case** | What if a dependency fails? | CouponService throws timeout → handle gracefully |
| **Boundary case** | What about values at the edge? | Discount = exactly 50% (cap) |
| **Edge case** | What about unusual inputs? | price = 0, coupon = empty string, role = unknown enum |

Group scenarios by the business rule they validate, not by input type.

---

### Step 4: Write Test Code

Write the test file following:
- **Arrange–Act–Assert** pattern — see [references/aaa-pattern.md](references/aaa-pattern.md)
- **Business-language naming** — see [references/naming-conventions.md](references/naming-conventions.md)
- **Proper mocking** — see [references/mocking-guide.md](references/mocking-guide.md)

#### Test File Structure

```typescript
// 1. Imports
import { describe, it, expect, beforeEach, vi } from 'vitest' // or Jest globals
import { calculateDiscount } from './discount-service'
import { CouponService } from './coupon-service'

// 2. Mock declarations (top-level)
vi.mock('./coupon-service')

// 3. Test suite grouped by function/behavior
describe('calculateDiscount', () => {
  // 4. Shared setup
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 5. Grouped by business rule
  describe('price validation', () => {
    it('should throw InvalidPriceError when price is negative', () => { ... })
    it('should return zero finalPrice when price is zero', () => { ... })
  })

  describe('role-based discount', () => {
    it('should apply 20% discount for VIP users', () => { ... })
    it('should apply 10% discount for member users', () => { ... })
    it('should apply no discount for guest users', () => { ... })
  })

  describe('coupon handling', () => {
    it('should apply additional 5% when coupon is valid', () => { ... })
    it('should ignore coupon when coupon is null', () => { ... })
    it('should handle CouponService timeout gracefully', () => { ... })
  })

  describe('discount cap', () => {
    it('should cap total discount at 50% even if role + coupon exceeds it', () => { ... })
  })
})
```

#### Key Rules When Writing

1. **One behavior per test** — if you need two `expect()` on different behaviors, split into two tests
2. **Descriptive names in business language** — `should reject checkout when cart is empty` not `test case 1`
3. **Use `it.each` for data-driven tests** — when multiple inputs test the same rule
4. **Mock only external dependencies** — do NOT mock the function under test
5. **Always clean up mocks** in `beforeEach` or `afterEach`

---

### Step 5: Validate Quality

After writing tests, run through this checklist.
See [references/first-principles.md](references/first-principles.md).

**FIRST Principles Check:**

- [ ] **Fast** — no real API calls, no database, no file system, no `setTimeout`
- [ ] **Independent** — can run any test in isolation, no shared mutable state
- [ ] **Repeatable** — no dependency on system clock, network, or environment
- [ ] **Self-Validating** — every test has clear `expect()` assertions
- [ ] **Timely** — tests are written alongside the production code

**Coverage Check:**

- [ ] Happy path covered for every public function
- [ ] At least one negative case per validation rule
- [ ] Error handling tested for every external dependency
- [ ] Boundary values tested for numeric/date inputs
- [ ] Edge cases tested (null, undefined, empty string, 0, max values)

**Anti-Pattern Check** — see [references/anti-patterns.md](references/anti-patterns.md):

- [ ] No test asserts on internal implementation details
- [ ] No test has more than one Act phase
- [ ] No generic test names
- [ ] No copy-pasted tests that should be `it.each`

---

### Step 6: Run Tests

After writing, always run the test to verify:

```bash
# Vitest
npx vitest run <path-to-test-file>

# Jest
npx jest <path-to-test-file> --no-coverage
```

If tests fail, fix them. Do NOT submit tests that you haven't verified pass.

---

## Relationship to Other Testing Skills

```
swe-test-planner           → "ควร test อะไรก่อน?"      (Risk-based prioritization)
swe-test-engineer          → "ต้องมี test case อะไร?"   (BVA/EP/STT → test case tables)
swe-test-unit-test-writer  → "เขียน .test.ts ยังไง?"    (Actual test code) ← YOU ARE HERE
```

If the user has output from `swe-test-engineer` (test case tables with TC-01, BT-01, etc.),
use those as the scenario design input — translate each TC row into a test case in code.

---

## Examples

See [references/examples.md](references/examples.md) for complete worked examples.

**Trigger phrases:**
- "เขียน unit test ให้ function นี้"
- "สร้าง test file สำหรับ service นี้"
- "เพิ่ม test coverage ให้ module นี้"
- "write unit tests for this TypeScript module"
- "refactor these tests to follow best practices"
