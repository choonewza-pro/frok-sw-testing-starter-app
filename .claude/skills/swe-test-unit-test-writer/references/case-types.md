# Test Case Types

Comprehensive coverage requires testing all paths — not just the happy path.

---

## Overview

> Test ที่ดีต้องไม่ทดสอบแค่ทางสำเร็จ
> การเขียน Test ที่ดีไม่ได้เริ่มจาก API ของ Testing Framework แต่เริ่มจากการ **เข้าใจ Behavior และ Contract ที่ระบบต้องรับประกัน**
> สำหรับองค์กร **Negative/Error case มักมีมูลค่าสูง** เพราะช่วยลด incident ใน production

### Contract Testing: Input, Output, Side Effect, Error
ก่อนเขียน test ให้ถามว่าฟังก์ชันหรือโมดูลนี้ **"รับประกันอะไร"** เช่น `formatPrice(amount, currency)`:
- **Input:** `amount` (number), `currency` (string)
- **Output:** formatted price string
- **Guarantees (Test Cases):**
  - `(10, 'USD')` → `'$10.00'` (Happy path)
  - `(10, 'EUR')` → `'€10.00'` (Different currency)
  - `(0, 'USD')` → `'$0.00'` (Zero boundary)
  - `(-5.5, 'USD')` → `'-$5.50'` (Negative amount)
  - `(10.999, 'USD')` → `'$11.00'` (Decimal rounding)

---

## 1. Positive Case (Happy Path)

**กรณีปกติที่ระบบควรทำงานสำเร็จ**

Input ถูกต้องทุกอย่าง, dependencies ทำงานปกติ, user มีสิทธิ์ → ระบบทำงานตาม spec

```typescript
it('should create order successfully when all inputs are valid', async () => {
  // Arrange
  const items = [{ productId: 'p1', quantity: 2, price: 500 }]
  const userId = 'user-1'
  mockUserRepo.findById.mockResolvedValue(createUser({ id: userId }))
  mockInventory.checkStock.mockResolvedValue(true)

  // Act
  const order = await createOrder(items, userId, null)

  // Assert
  expect(order.status).toBe('confirmed')
  expect(order.totalPrice).toBe(1000)
})
```

**Coverage goal:** At least one happy path per public function.

---

## 2. Negative Case

**กรณีที่ระบบควรปฏิเสธอย่างถูกต้อง — input ผิดหรือสิทธิ์ไม่พอ**

```typescript
// Input validation
it('should throw EmptyCartError when items array is empty', () => {
  expect(() => createOrder([], 'user-1', null)).toThrow(EmptyCartError)
})

// Authorization
it('should throw ForbiddenError when user role is guest', async () => {
  mockUserRepo.findById.mockResolvedValue(createUser({ role: 'guest' }))
  
  await expect(deleteProduct('p1', 'guest-user'))
    .rejects.toThrow(ForbiddenError)
})

// Business rule violation
it('should reject order when item quantity exceeds stock', async () => {
  mockInventory.checkStock.mockResolvedValue(false)
  
  await expect(createOrder([{ productId: 'p1', quantity: 999 }], 'user-1', null))
    .rejects.toThrow(InsufficientStockError)
})
```

**Coverage goal:** At least one negative case per validation rule or permission check.

---

## 3. Error Case

**กรณีที่ dependency ล้มเหลว — API timeout, database error, invalid token**

```typescript
// Database failure
it('should throw ServiceError when database connection fails', async () => {
  mockOrderRepo.save.mockRejectedValue(new Error('Connection refused'))
  
  await expect(createOrder(validItems, 'user-1', null))
    .rejects.toThrow(ServiceError)
})

// External API timeout
it('should throw PaymentTimeoutError when payment gateway times out', async () => {
  mockPaymentGateway.charge.mockRejectedValue(new TimeoutError())
  
  await expect(processPayment('order-1', 1000))
    .rejects.toThrow(PaymentTimeoutError)
})

// Invalid response from dependency
it('should throw ParseError when external API returns malformed JSON', async () => {
  mockExternalApi.fetch.mockResolvedValue({ data: 'not-valid-json' })
  
  await expect(syncProducts())
    .rejects.toThrow(ParseError)
})
```

**Coverage goal:** At least one error case per external dependency (DB, API, queue, etc.).

---

## 4. Boundary Case

**ค่าที่อยู่ตรงขอบของ rule — ค่าสุดท้ายที่ valid และค่าแรกที่ invalid**

```typescript
describe('age validation (min: 18, max: 60)', () => {
  it.each([
    { age: 17, shouldPass: false, label: 'below minimum' },
    { age: 18, shouldPass: true,  label: 'exactly minimum' },
    { age: 19, shouldPass: true,  label: 'just above minimum' },
    { age: 59, shouldPass: true,  label: 'just below maximum' },
    { age: 60, shouldPass: true,  label: 'exactly maximum' },
    { age: 61, shouldPass: false, label: 'above maximum' },
  ])('should validate age $age ($label)', ({ age, shouldPass }) => {
    if (shouldPass) {
      expect(() => validateAge(age)).not.toThrow()
    } else {
      expect(() => validateAge(age)).toThrow(InvalidAgeError)
    }
  })
})
```

**Coverage goal:** For every numeric/date boundary, test: min-1, min, min+1, max-1, max, max+1.

### Representative Boundary & Edge Values (`parseAge`)

> **กฎสำคัญ:** ไม่จำเป็นต้อง Test ทุกค่า แต่ให้เลือกค่าที่เป็น **ตัวแทน (Representative Values)** ของ Boundary และ Error Path

สมมติฟังก์ชัน `parseAge(input)` ที่รับอายุ 0 ถึง 150 ปี:

| Input | ประเภท | ผลลัพธ์ที่คาดหวัง | เหตุผลที่เป็นตัวแทน |
|---|---|---|---|
| `25` | Valid Normal | `25` | ตัวแทน Happy Path ปกติ |
| `25.9` | Float coercion | `25` (floor) | ตรวจการปัดเศษทศนิยม |
| `0` | Min boundary | `0` | ค่าต่ำสุดที่อนุญาต (Valid Boundary) |
| `150` | Max boundary | `150` | ค่าสูงสุดที่อนุญาต (Valid Boundary) |
| `-1` | Below min | throws error | ขอบล่างที่หลุดช่วง (Invalid) |
| `151` | Above max | throws error | ขอบบนที่หลุดช่วง (Invalid) |
| `'abc'` | Invalid type | throws error | ข้อมูลที่ไม่ใช่ตัวเลข (Malformed) |
| `''` | Empty string | throws error | ข้อมูลว่างเปล่า (Edge Case) |

---

## 5. Edge Case

**สถานการณ์ไม่ปกติหรือสุดขอบที่อาจทำให้ระบบพัง**

Common edge cases to always consider:

| Edge Case | Example |
|-----------|---------|
| `null` / `undefined` | `createOrder(null, 'user-1', null)` |
| Empty string `""` | `searchProducts("")` |
| Zero `0` | `calculateDiscount(0, 'vip', null)` |
| Negative number | `setQuantity(-1)` |
| Very large number | `setQuantity(Number.MAX_SAFE_INTEGER)` |
| Special characters | `searchProducts("'; DROP TABLE --")` |
| Unicode / Thai text | `createUser({ name: "ทดสอบ" })` |
| Array with one item | `calculateTotal([singleItem])` |
| Duplicate items | `addToCart([item, item])` |

```typescript
describe('edge cases', () => {
  it('should handle null input gracefully', () => {
    expect(() => searchProducts(null as any)).toThrow(InvalidInputError)
  })

  it('should return empty results for empty string search', async () => {
    const results = await searchProducts('')
    expect(results).toEqual([])
  })

  it('should handle zero price without dividing by zero', () => {
    const result = calculateDiscount(0, 'vip', null)
    expect(result.finalPrice).toBe(0)
  })
})
```

**Coverage goal:** At least test null, empty, and zero for every critical input.

---

## 6. Security-Related Case

**กรณีเกี่ยวกับ security — role, session, input แปลก**

```typescript
describe('security', () => {
  it('should reject request when user has no role', async () => {
    mockUserRepo.findById.mockResolvedValue(createUser({ role: undefined }))
    
    await expect(adminAction('user-1'))
      .rejects.toThrow(UnauthorizedError)
  })

  it('should reject request when session token is expired', async () => {
    mockAuth.validateToken.mockResolvedValue({ valid: false, reason: 'expired' })
    
    await expect(protectedAction('expired-token'))
      .rejects.toThrow(SessionExpiredError)
  })

  it('should sanitize input to prevent injection', () => {
    const result = sanitizeInput("'; DROP TABLE users; --")
    expect(result).not.toContain('DROP TABLE')
  })
})
```

**Coverage goal:** At least test unauthenticated, unauthorized, and malicious input scenarios.

---

## Priority Order

When time is limited, test in this order:

1. 🔴 **Happy path** — ensures the feature works at all
2. 🔴 **Negative cases** — ensures validation catches bad input
3. 🟠 **Error cases** — ensures graceful failure when dependencies break
4. 🟠 **Boundary cases** — catches off-by-one errors
5. 🟡 **Edge cases** — catches unusual input scenarios
6. 🟡 **Security cases** — catches authorization gaps
