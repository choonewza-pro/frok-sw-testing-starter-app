# TEST_1.2 Admin Access guard (P0, Risk 25 Critical)

* Route: `/admin`, `/admin/products`
* Spec: `e2e/admin-access.spec.ts` — ใช้ `storageState` (`admin.json` / `user.json` จาก `auth.setup.ts`)
* Sources: `src/lib/admin/require-admin.ts:11-17`, `src/lib/admin/admin-guard.ts:12`, `src/app/admin/page.tsx:9-18`

## Preconditions

* `auth.setup.ts` login 2 บัญชีแล้ว save state (รันครั้งเดียว ไม่ login ซ้ำทุกเคส)

## Cases

| ID | ชื่อ | Steps | Assert |
|---|---|---|---|
| G1 | `redirects to /login when anonymous visits /admin` | clear storage → `goto('/admin')` | `toHaveURL(/.*login/)` ไม่เห็น `dashboard` |
| G2 | `redirects to /login when anonymous visits /admin/products` | เหมือน G1 กับ `/admin/products` | `toHaveURL(/.*login/)` ไม่เห็น `products-admin` |
| G3 | `redirects to / when user visits /admin` | `test.use({storageState:user.json})` → `goto('/admin')` | `toHaveURL` เป็น `/` + ไม่เห็น `dashboard` |
| G4 | `redirects to / when user visits /admin/products` | เหมือน G3 | ไม่เห็น `products-admin` |
| G5 | `shows dashboard when admin visits /admin` | `storageState:admin.json` → `goto('/admin')` | `dashboard` + `kpi-orders` visible |
| G6 | `shows products admin when admin visits /admin/products` | เหมือน G5 | `products-admin` + `product-create` visible |
| G7 | `navigates between dashboard and products via admin nav` | จาก `/admin` กด nav | `admin-nav-products` → `/admin/products`, `admin-nav-dashboard` → `/admin` |

## Isolation

* อ่านอย่างเดียว ไม่สร้าง/ลบข้อมูล — รัน parallel ได้
* ห้ามใช้ context ของ G1/G2 ร่วมกับ G5/G6

## Out of scope

* `isAdmin()` 6 partitions (null/undefined/ADMIN/superadmin) — Vitest unit

## Traceability

* ST-04/05/09, SJ-02/03 ใน `test-cases/auth-admin-access-control.md`
