# TEST_1.0 Overview — E2E Plan (P0+P1, Seed isolated DB)

> สถานะ: approved — พร้อม implement `.spec.ts` หลังไฟล์แผนครบ
> วันที่ verify: 2026-09-17 | วิธี verify: SELECT readonly จาก `prisma/dev.db`

## 1. Test Data กลาง (fixed)

| Role | Email | Password | Role ใน DB | หมายเหตุ |
|---|---|---|---|---|
| admin | `admin@test.com` | `12345678` | `admin` | ผ่าน `isAdmin()` (`src/lib/admin/admin-guard.ts:12`) |
| user | `user@test.com` | `12345678` | `user` | default role, `input:false` (`src/lib/auth.ts:28-30`) |

* verify แล้ว: `SELECT email, role FROM user` เจอครบทั้ง 2 rows ใน `prisma/dev.db`
* `12345678` ยาว 8 ตัว = `MIN_PASSWORD_LENGTH` (`src/lib/auth-schema.ts:10`, `src/lib/auth.ts:21`) — boundary พอดี
* รหัสผ่านใน spec อ่านจาก `process.env.E2E_ADMIN_PASSWORD ?? '12345678'` (ไม่ hardcode ใน CI log)
* signup ใหม่ใช้ email unique: `e2e-${Date.now()}-${workerIndex}@test.com`
* สินค้า E2E ใช้ชื่อ `E2E-${Date.now()}` กันชนตอน `fullyParallel:true`

## 2. สภาพแวดล้อม

* `baseURL: http://localhost:3030` (`playwright.config.ts:31`)
* `webServer: npm run dev` + `reuseExistingServer` — วิ่งบน `prisma/dev.db` (ไม่ใช่ `test.db`)
* `scripts/setup-test-db.mjs` seed แค่ products 50 รายการ — **ไม่ได้ seed users** ห้ามรัน `--empty` โดยไม่ seed users ซ้ำ
* Browser: `chromium` โปรเจกต์เดียว (`playwright.config.ts:42-50`)

## 3. โครง e2e ที่จะสร้าง

```
e2e/
  auth.setup.ts              # login 2 บัญชีครั้งเดียว -> playwright/.auth/admin.json, user.json
  fixtures.ts                # test.extend({ adminPage, userPage })
  pages/LoginPage.ts / SignupPage.ts / CatalogPage.ts / CartPage.ts / AdminProductsPage.ts
  auth.spec.ts / admin-access.spec.ts / product-catalog.spec.ts
  cart-checkout.spec.ts / contact.spec.ts
  admin-products.spec.ts / admin-dashboard.spec.ts / course.spec.ts
```

* ลบ `e2e/playwright-demo.spec.ts` (ยิง `playwright.dev` นอกระบบ)
* `playwright.config.ts` เพิ่ม setup project + `storageState` + `dependencies:['setup']`
* `auth.spec.ts` + เคส logout ใช้ fresh context ห้ามใช้ `admin.json` ร่วม (กันเตะ session กันเอง)

## 4. กติกากัน flaky (บังคับ)

1. ห้าม `waitForTimeout/sleep` — ใช้ web-first assertions (`toBeVisible/toHaveURL/toHaveCount/toHaveText`) อย่างเดียว
2. Locator: `getByRole/getByLabel` ก่อน, `getByTestId` สำหรับ widget ไม่มี semantics (badge/KPI)
3. 1 test = 1 behavior (`[expected when scenario]`)
4. Unique data ทุกครั้งที่สร้าง (parallel-safe) + cleanup หลังเทส ไม่ปล่อยค้าง `dev.db`
5. `trace: on-first-retry`, `screenshot/video: only-on-failure/retain-on-failure` (คงเดิม)

## 5. สารบัญแผนย่อย

| ไฟล์ | Feature | Priority | Risk | Spec ปลายทาง |
|---|---|---|---|---|
| TEST_1.1 | Auth (signup/login/logout) | P0 | 25 Critical | `e2e/auth.spec.ts` |
| TEST_1.2 | Admin Access guard | P0 | 25 Critical | `e2e/admin-access.spec.ts` |
| TEST_1.3 | Product Catalog | P0 | 15 High | `e2e/product-catalog.spec.ts` |
| TEST_1.4 | Cart + Checkout | P0 | 12 High | `e2e/cart-checkout.spec.ts` |
| TEST_1.5 | Contact Us | P0 | 15 High | `e2e/contact.spec.ts` |
| TEST_1.6 | Admin Product CRUD | P1 | 20 Critical | `e2e/admin-products.spec.ts` |
| TEST_1.7 | Admin Dashboard | P1 | 12 High | `e2e/admin-dashboard.spec.ts` |
| TEST_1.8 | Course Catalog | P1 | 15 High | `e2e/course.spec.ts` |

## 6. Known limitation (เปิด defect แยก)

* ปุ่ม `ยืนยันการสั่งซื้อ` (`src/app/(front)/components/CartList.tsx:87-88`) ทำแค่ `clearCart()+router.replace('/product')` (`CartList.tsx:19-22`) — **ไม่มี `POST /orders`, ไม่มี order row ใหม่** (`src/app/api/admin/` มีแค่ `GET orders`)
* E2E `TEST_1.4` จะ assert ตามจริง (ล้าง+redirect) ไม่ assert ว่ามี order เกิดใหม่
* Expected ที่ควรเป็น: `POST /api/orders` สร้าง `orders+order_items` -> หน้า success -> admin เห็นใน `recent-orders-card`

## 7. Out of scope ของ E2E (ไป Vitest)

* BVA ละเอียด: email 50 แบบ, password 7/8/51 ตัว, price 0/-1/10M, message 9/10/2000 — อยู่ใน `test-cases/*.md` แล้ว ให้เป็น `tests/unit/*` + `tests/integration/*`
* สูตรคำนวณล้วน (`stats/revenue/lineTotal`) — integration เร็วกว่า 100x

## 8. วิธีรัน

```bash
npx playwright test                 # ทั้งชุด (53 tests: 2 setup + 51 chromium)
npx playwright test e2e/auth.spec.ts
npx playwright test --ui            # debug time-travel
npx playwright show-report          # ดูผล
```

## 9. Implementation notes (2026-09-17, ผลรันจริง 53/53 green ~23s)

* `workers: 4` (local) — เคยใช้ 16 แล้ว SQLite/better-auth ล็อกจน auth flaky
* E2E เจอบั๊กจริง 1 ตัวและแก้แล้ว: `contact-form.tsx` อ่าน `event.currentTarget`
  หลัง `await` ของ zodResolver (ได้ null -> FormData throw -> ส่งไม่ได้เลยทุกเคส)
  แก้โดยอ่าน FormData แบบ sync ใน onSubmit wrapper แล้วส่ง website string เข้า onSubmit
* `home.spec.ts` เดิม assert alt "โลโก้ Next.js1" ที่ไม่มีอยู่จริง -> แก้เป็น "โลโก้ Next.js"
* `playwright/.auth/` (storageState) ถูกเพิ่มใน `.gitignore` แล้ว — ห้าม commit session
* ไม่มีข้อมูล E2E ค้างใน `dev.db` (product E2E-* ถูกลบโดยเคส delete, เหลือแค่ users จาก signup ซึ่งเป็นหลักฐาน role)

## Traceability

* `test-plan/risk-plan-2026-09-16.md` (Risk table 9 features)
* `test-cases/*.md` (8 ไฟล์ EP/BVA/STT)
* `src/lib/auth-schema.ts:12-45`, `src/lib/auth.ts`, `src/lib/admin/require-admin.ts:11-17`, `src/app/(front)/components/CartList.tsx`
