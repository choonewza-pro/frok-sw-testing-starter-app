# Test Scenario Design

Think scenarios BEFORE writing code — not the other way around.

---

## Core Principle

> เริ่มจาก **behavior** ที่ผู้ใช้หรือ business คาดหวัง ไม่ใช่เริ่มจาก line of code
>
> คิด happy path, negative path, edge case และ boundary case **ก่อนเขียนแม้แต่ test แรก**

---

## Scenario Design Process

### 1. List All Business Rules

Read the source code or spec and extract every rule:

```
Function: createOrder(items, userId, couponCode)

Rules:
R1. items ต้องมีอย่างน้อย 1 item
R2. แต่ละ item quantity ต้อง ≥ 1 และ ≤ 99
R3. userId ต้อง exist ในระบบ
R4. couponCode ถ้ามีต้อง valid และยังไม่หมดอายุ
R5. totalPrice = sum(item.price * item.quantity) - discount
R6. ถ้า totalPrice > 100,000 ต้อง flag เพื่อ manual review
```

### 2. For Each Rule, Think Through Scenario Types

| Type | คำถาม | ตัวอย่าง (R1) |
|------|--------|--------------|
| **Happy path** | กรณีปกติที่ควรสำเร็จ | items มี 1 item → create order สำเร็จ |
| **Negative path** | กรณีที่ระบบควรปฏิเสธ | items เป็น empty array → throw error |
| **Boundary case** | ค่าตรงขอบเงื่อนไข | items มี exactly 1 item (minimum valid) |
| **Edge case** | สถานการณ์ไม่ปกติ | items เป็น null, undefined |
| **Error case** | dependency ล้มเหลว | database timeout ตอน save order |

### 3. Write as a Scenario Table

Before writing code, list scenarios in a table:

```markdown
| # | Rule | Scenario | Input | Expected |
|---|------|----------|-------|----------|
| 1 | R1 | Happy: 1 item | items: [{ id: 1, qty: 2 }] | Order created |
| 2 | R1 | Happy: multiple items | items: [{ id: 1, qty: 1 }, { id: 2, qty: 3 }] | Order created |
| 3 | R1 | Negative: empty items | items: [] | Throw EmptyCartError |
| 4 | R1 | Edge: null items | items: null | Throw InvalidInputError |
| 5 | R2 | Boundary: qty = 1 | qty: 1 | Valid |
| 6 | R2 | Boundary: qty = 99 | qty: 99 | Valid |
| 7 | R2 | Boundary: qty = 0 | qty: 0 | Throw InvalidQuantityError |
| 8 | R2 | Boundary: qty = 100 | qty: 100 | Throw InvalidQuantityError |
| 9 | R6 | Boundary: total = 100,000 | total: exactly 100000 | Flag for review |
| 10 | R6 | Boundary: total = 99,999 | total: 99999 | No flag |
```

### 4. Translate Table to Tests

Each row becomes one `it()` block. Group by rule using nested `describe()`.

---

## Avoiding Redundant Scenarios

> หลีกเลี่ยง test case ที่ต่างกันแค่ค่าข้อมูล แต่ไม่ได้เพิ่มความเสี่ยงที่ครอบคลุม

Ask yourself: **"Does this scenario test a different code path?"**

```typescript
// ❌ Redundant — both test the same "valid item" path
it('should create order with 2 items', () => { ... })
it('should create order with 3 items', () => { ... })
// qty 2 and qty 3 exercise the SAME branch

// ✅ Better — each tests a different code path
it('should create order with 1 item (minimum)', () => { ... })      // boundary
it('should create order with multiple items', () => { ... })         // happy path
it('should reject order with empty items', () => { ... })            // negative
it('should reject order with item qty 0', () => { ... })             // boundary invalid
```

---

## Using Table-Driven Tests

When **one rule** has **many inputs** with the **same assertion pattern**, use `it.each`:

```typescript
describe('role-based discount', () => {
  it.each([
    { role: 'vip',    expectedDiscount: 0.20, label: 'VIP gets 20%' },
    { role: 'member', expectedDiscount: 0.10, label: 'member gets 10%' },
    { role: 'guest',  expectedDiscount: 0.00, label: 'guest gets 0%' },
  ])('should apply correct discount: $label', ({ role, expectedDiscount }) => {
    const result = calculateDiscount(1000, role, null)
    expect(result.discountRate).toBe(expectedDiscount)
  })
})
```

Use `it.each` when:
- ✅ Same assertion logic, different input/output pairs
- ✅ Testing boundary values (min, min-1, max, max+1)

Do NOT use `it.each` when:
- ❌ Each scenario has different assertion logic
- ❌ Each scenario needs different mock setup
