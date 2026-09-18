# TEST_1.6 Admin Product CRUD (P1, Risk 20 Critical)

* Route: `/admin/products` (`src/app/admin/products/page.tsx`, `ProductsClient.tsx:111-213`)
* Spec: `e2e/admin-products.spec.ts` — `storageState: admin.json` อย่างเดียว
* Sources: `src/app/admin/components/ProductFormDialog.tsx:76-202`, `DeleteProductDialog.tsx:30-50`, `src/app/api/admin/products/route.ts:41`, `src/lib/admin/product-schema.ts`

## Preconditions

* login `admin@test.com` ผ่าน setup แล้ว
* ชื่อสินค้า E2E: `E2E-${Date.now()}-${workerIndex}` (parallel-safe)
* ต้องมี category อย่างน้อย 1 row ใน DB (เลือก option แรกใน `product-category-select`)

## Cases

| ID | ชื่อ | Steps | Locators | Assert |
|---|---|---|---|---|
| P1 | `creates product when valid` | `product-create` → fill `product-name-input/description-input/price-input/category-select` → `product-form-submit` | `product-form-dialog/title/form/submit` | เจอ `product-row-name` ใหม่ + `product-row-price` ตรง |
| P2 | `shows validation when price invalid` | fill price `-5` / ว่าง → submit | `product-price-input` + FieldError | dialog ยังเปิด + error visible, row ไม่เพิ่ม |
| P3 | `edits price when edit clicked` | จาก row P1 กด `product-edit` → แก้ price → submit | `product-edit` + `product-form-submit` | `product-row-price` เปลี่ยน |
| P4 | `deletes product when confirm` | จาก row P1 กด `product-delete` → `delete-confirm` | `delete-dialog/message/confirm/cancel` | row หาย + `product-table-empty` ถ้าหมด (หรือ count ลด) |
| P5 | `cancels delete when cancel clicked` | กด delete → `delete-cancel` | `delete-cancel` | dialog ปิด + row ยังอยู่ |
| P6 | `blocks delete when has order_items (409)` | เลือก product ที่มี order อ้าง (id=2 Samsung ตาม seed) → delete → confirm | `delete-dialog-message` | error/409 visible + row ยังอยู่ |
| P7 | `denies API when user role calls POST` | `user.json` ยิง `POST /api/admin/products` ตรงๆ | status | 401/403 (พิสูจน์ API guard ไม่ใช่แค่ UI) |
| P8 | `searches and paginates in admin table` | fill `product-search` → next/prev | `product-search/row/prev/next/pagination` | row กรอง + เปลี่ยนหน้าได้ |

## Isolation/Cleanup

* P1 สร้าง → P3/P4 ใช้ row เดียวกันต่อ (chain ใน `describe.serial` เดียว) หรือ cleanup ด้วย `DELETE /api/admin/products/:id` หลังเทส
* P6 ใช้ product จริงที่มี order — ห้ามลบจริง assert แค่ถูกบล็อก
* P7 อ่าน status อย่างเดียว ไม่สร้างข้อมูล

## Out of scope

* BVA price >0..10M, ชื่อ 1-255, `parseNumberInput` comma/space/NaN — service unit (`test-cases/admin-product-crud.md`)

## Traceability

* `test-cases/admin-product-crud.md`, Risk #2
