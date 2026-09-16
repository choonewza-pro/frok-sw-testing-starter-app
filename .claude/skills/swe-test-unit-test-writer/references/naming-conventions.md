# Test Naming Conventions

Good test names communicate business rules — not implementation details.

---

## Recommended Formats

### 1. Modern Standard (Active Present Tense — Recommended)

```
<verb in present tense> <expected outcome> [when / if / for <condition>]
```

Reads naturally with `it(...)` as a factual guarantee ("It returns...", "It throws..."):
```typescript
it('returns formatted price for USD')
it('returns 0 for an empty cart')
it('throws InvalidEmailError if email format is invalid')
it('caps discount at 50% when role + coupon exceeds limit')
```

### 2. Adaptive Rule: Respect Existing Conventions

If the existing codebase consistently uses BDD-style `should ... when ...`, follow the repository's convention:
```typescript
it('should return 0 when cart is empty')
```

---

## Key Principles

### 1. Name for CI Diagnostics
เวลาที่ Test Fail ใน CI ชื่อ Test ต้องบอกทันทีว่า **"Behavior ไหนเสีย"** โดยไม่ต้องคลิกเข้าไปดู implementation:

| ❌ หลีกเลี่ยง (คลุมเครือ / Implementation) | ✅ แนะนำ (บอก Behavior ชัดเจน) |
|---|---|
| `works correctly` | `returns formatted price for USD` |
| `handles edge case` | `returns 0 for an empty cart` |
| `calls Intl correctly` | `formats negative amount with leading minus sign` |
| `test 1` | `throws InvalidEmailError if email format is invalid` |

---

### 2. The "And Smell" Heuristic (One Behavior Per Test)

> **กฎเช็คเร็ว:** ถ้าชื่อ Test มีคำว่า **"and"** หลายครั้ง แสดงว่ากำลังตรวจหลายเรื่องใน Test เดียว ให้แยก Test ทันที!

```typescript
// ❌ Anti-pattern — ตรวจหลาย behavior ใน test เดียว
it('formats price and handles errors and logs result', () => { ... })

// ✅ แนะนำ — แยก 1 test ต่อ 1 behavior ชัดเจน
it('formats USD price correctly', () => { ... })
it('throws when currency is invalid', () => { ... })
it('logs formatting error', () => { ... })
```

---

### 3. Use Business Language
```typescript
// ✅ Good — reads like a business rule
it('rejects checkout when cart is empty')
it('applies 20% discount for VIP users')
it('locks account after 5 failed login attempts')

// ❌ Bad — describes implementation details
it('calls repository.save')
it('sets local state variable to true')
```

---

### 4. Include the Condition & Be Specific
```typescript
// ✅ Good — condition and outcome are explicit
it('throws InvalidPriceError when price is negative')
it('returns empty array when no products match filter')

// ❌ Bad — condition or outcome is missing
it('throws error')      // which error? when?
it('returns results')   // what results? under what condition?
```

---

## Describe Block Naming

Group tests by **behavior area**, not by method name:

```typescript
// ✅ Good — grouped by behavior
describe('calculateDiscount', () => {
  describe('price validation', () => { ... })
  describe('role-based discount', () => { ... })
  describe('coupon handling', () => { ... })
  describe('discount cap', () => { ... })
})

// ❌ Bad — flat list with no grouping
describe('calculateDiscount', () => {
  it('test 1', () => { ... })
  it('test 2', () => { ... })
  it('test 3', () => { ... })
  // 20 tests with no structure...
})
```

---

## Naming for it.each

Use template literals for dynamic names:

```typescript
// ✅ Good — descriptive with values
it.each([
  { role: 'vip', expected: 0.20 },
  { role: 'member', expected: 0.10 },
  { role: 'guest', expected: 0.00 },
])('should return $expected discount rate for $role user', ({ role, expected }) => {
  ...
})

// Output:
// ✓ should return 0.2 discount rate for vip user
// ✓ should return 0.1 discount rate for member user
// ✓ should return 0 discount rate for guest user
```

```typescript
// ❌ Bad — generic label
it.each(testCases)('case %#', (input) => { ... })
// Output: "case 0", "case 1", "case 2" — meaningless
```

---

## Error Test Naming

For tests that verify errors, name the error type:

```typescript
// ✅ Good — names the specific error
it('should throw InvalidPriceError when price is negative')
it('should throw NotFoundError when user does not exist')
it('should throw PaymentTimeoutError when gateway times out')

// ❌ Bad — generic
it('should throw an error')
it('should fail')
```

---

## Quick Reference

| Pattern | Example |
|---------|---------|
| Happy path | `should create order when all inputs are valid` |
| Negative validation | `should throw EmptyCartError when items array is empty` |
| Boundary | `should accept age 18 (exactly minimum)` |
| Edge case | `should handle null input gracefully` |
| Error from dep | `should throw ServiceError when database connection fails` |
| Security | `should reject request when user has no role` |
| State change | `should set status to "locked" after 5 failed attempts` |
| Side effect | `should send email notification when order is confirmed` |
