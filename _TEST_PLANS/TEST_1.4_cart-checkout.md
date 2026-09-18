# TEST_1.4 Cart + Checkout (P0, Risk 12 High)

* Route: `/product` → `/cart` (`src/app/(front)/cart/page.tsx`, `CartList.tsx:11-94`)
* Spec: `e2e/cart-checkout.spec.ts` — public + 1 เคส login
* Sources: `src/app/(front)/components/CartList.tsx:19-94`, `src/lib/cart/cart-store.ts`, `src/lib/cart/cart-logic.ts` (`lineTotal`)

## Preconditions

* `beforeEach`: `localStorage.clear()` + fresh context (กันตะกร้าค้างข้ามเคส)
* ใช้สินค้าจริงจาก `/product` (เช่น Samsung Galaxy S25 ราคา 32900.00 ตามรูป)

## Cases

| ID | ชื่อ | Steps | Locators | Assert |
|---|---|---|---|---|
| K1 | `adds product and updates badge when add clicked` | `/product` → กด `add-to-cart` | `add-to-cart/cart-count/nav-cart` | `cart-count` เป็น 1 + `localStorage skill-cart` มีค่า |
| K2 | `persists cart after reload` | K1 แล้ว `reload()` → `goto('/cart')` | `cart-list/cart-row/cart-item-name/qty/total` | row ยังอยู่ ชื่อ/qty/total ตรงเดิม |
| K3 | `updates total when quantity changed` | add ซ้ำ / ลบ 1 ชิ้น (`cart-remove-item`) | `cart-item-qty/cart-item-total/cart-total` | `cart-total` = sum(`lineTotal`) |
| K4 | `removes row when delete clicked` | กดถังขยะรายแถว | `cart-remove-item` → `cart-row` | row หาย, ถ้าหมด → `cart-empty` |
| K5 | `clears all when clear clicked` | กด `ลบสินค้าทั้งหมด` | `cart-clear` | `cart-empty` visible |
| K6 | `clears cart and redirects to /product when checkout with items` | มีของในตะกร้า → กด `ยืนยันการสั่งซื้อ` | `cart-checkout` (`CartList.tsx:87`) | `toHaveURL(/.*product/)` + กลับ `/cart` เจอ `cart-empty` |
| K7 | `hides checkout when cart empty` | `goto('/cart')` ตอนว่าง | `cart-empty` | เห็น `cart-empty` และไม่เห็น `cart-checkout` |
| K8 | `keeps cart for logged-in user after reload` | login `user@test.com` → add → reload | เดียวกัน + `nav-user-name` | ตะกร้ายังอยู่ |

## Known limitation (สำคัญ)

* K6 assert ตามจริง: `handleCheckout()` แค่ `clearCart()+replace('/product')` ไม่ได้ `POST /orders` — ไม่มี order row ใหม่ใน DB (verify แล้ว `src/app/api/admin/` มีแค่ `GET orders`)
* ห้าม assert ว่า `/admin` มี order เพิ่ม — เก็บเป็น TODO รอ backend จริง (ดู TEST_1.0 §6)

## Out of scope

* BVA qty 0/ลบ/ซ้ำ/totalPrice — `cart-logic` unit (`test-cases/cart.md`)

## Traceability

* `test-cases/cart.md`, `test-cases/order-management.md` (บางส่วน), Risk #7/#3
