# Test Cases — Product Catalog (EP + BVA)

Sources: `src/lib/product/product-params.ts:14-44`

## Input Analysis

- C1 q — string trim, array→"" → EP
- C2 page — NaN→1, <1→1 → BVA
- C3 totalPages/skip — calcTotalPages/calcSkip → BVA

## C1 q (EP)

| ID | Name | Description | Input: q | Expected Output |
|---|---|---|---|---|
| TC-01 | Normal search | ค้นหาปกติ | iPhone | Valid - accepted (q=iPhone) |
| TC-02 | Trim spaces | ตัดช่องว่างหัวท้าย | `  mac  ` | Valid - accepted (q=mac) |
| TC-03 | Empty search | ไม่ค้นหา แสดงทั้งหมด |  | Valid - accepted (q="") |
| TC-04 | Array input | ส่ง array มา ได้ "" | ["a","b"] (array) | Valid - accepted (q="") |
| TC-05 | Thai search | ค้นหาภาษาไทย | แอร์พอด | Valid - accepted |

| ID | Name | Description | Input: q | Expected Output |
|---|---|---|---|---|
| BT-01 | Shopper searches brand | ลูกค้าหา Samsung | Samsung | Valid - accepted |
| BT-02 | Empty browse | เลื่อนดูทั้งหมดไม่ค้นหา |  | Valid - accepted |

## C2+C3 page/skip/totalPages (BVA)

| ID | Name | Description | Input: page | Input: total/pageSize | Calculated: page/skip/pages | Expected Output |
|---|---|---|---|---|---|
| TC-06 | Missing page | ไม่ส่งมา ได้ 1 | undefined | - | page 1 | Valid - accepted |
| TC-07 | Zero clamps | 0 โดนดันเป็น 1 | 0 | - | page 1 | Valid - accepted |
| TC-08 | Negative clamps | -3 โดนดันเป็น 1 | -3 | - | page 1 | Valid - accepted |
| TC-09 | Non-numeric falls back | "abc" กลับเป็น 1 | abc | - | page 1 | Valid - accepted |
| TC-10 | Valid page 2 | หน้า 2 skip 10 | 2 | size 10 | skip 10 | Valid - accepted |
| TC-11 | Empty store 1 page | สินค้า 0 ชิ้น ยังมี 1 หน้า | 1 | total 0 / size 10 | totalPages 1 | Valid - accepted |
| TC-12 | Exact full pages | 20 ชิ้น size 10 ได้ 2 หน้า | - | total 20 / size 10 | totalPages 2 | Valid - accepted |
| TC-13 | Partial last page | 21 ชิ้น size 10 ได้ 3 หน้า | - | total 21 / size 10 | totalPages 3 | Valid - accepted |
| TC-14 | Zero pageSize guards | pageSize 0 กันหารศูนย์ ได้ 1 หน้า | - | total 50 / size 0 | totalPages 1 | Valid - accepted |

| ID | Name | Description | Input: page | Expected Output |
|---|---|---|---|---|
| BT-03 | First page browse | เปิดหน้าสินค้าครั้งแรก | 1 | Valid - accepted |
| BT-04 | Deep link page 5 | แชร์ลิงก์ ?page=5 | 5 | Valid - accepted |
