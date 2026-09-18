# TEST_1.3 Product Catalog (P0, Risk 15 High)

* Route: `/product?q=&page=` (`src/app/(front)/product/page.tsx:12-29`)
* Spec: `e2e/product-catalog.spec.ts` — public ไม่ต้อง login
* Sources: `src/components/features-product.tsx:41-137`, `src/lib/product/product-service.ts` (`getProductList`)

## Preconditions

* `dev.db` มี products จาก seed (50 รายการ) — ไม่ต้องสร้างเพิ่ม

## Cases

| ID | ชื่อ | Steps | Locators | Assert |
|---|---|---|---|---|
| C1 | `shows product list when visiting /product` | `goto('/product')` | `product-list/product-card/product-name/product-price` | `product-card` count > 0 |
| C2 | `filters results when searching by keyword` | fill `product-search-input` คำที่มีจริง (เช่น `Samsung`) → `product-search-submit` | `product-search-form/input/submit` | URL มี `?q=` + `product-card` count ลดแต่ > 0 |
| C3 | `shows empty state when no match` | search คำมั่ว `zzz-no-match-999` | `product-empty` | `product-empty` visible + `product-card` count 0 |
| C4 | `navigates to next and prev page` | จาก `/product` กด next → prev | `product-next-page/prev-page/pagination-status` | status เปลี่ยนเลขหน้า, prev กลับได้ |
| C5 | `keeps search keyword after pagination` | search แล้วกด next | เดียวกัน | URL ยังมี `?q=` เดิม |

## Isolation

* อ่านอย่างเดียว — parallel-safe
* ห้าม assert จำนวน card ตายตัว (seed เปลี่ยนได้) assert แค่ `>0 / =0 / เปลี่ยน`

## Out of scope (ไป unit/integration)

* BVA `page` (NaN→1, <1→1, 0 สินค้า→1 หน้า), `q` trim/array→"" — `getProductList` unit ใน `test-cases/product-catalog.md`

## Traceability

* `test-cases/product-catalog.md`, Risk #4
