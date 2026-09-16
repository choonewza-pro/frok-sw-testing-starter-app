# Test Cases — Order Management (BVA + EP)

Sources: `src/lib/admin/admin-params.ts:18-37`, `src/lib/admin/admin-repository.ts:39-56`

## Input Analysis

- C1 Orders limit — default 5, clamp max 50 → BVA 1–50
- C2 RouteId — int บวก ไม่งั้น null → EP
- C3 Status display — `status ?? "unknown"` → EP
- C4 TotalAmount — `total_amount ?? 0` → BVA

## C1 Limit (BVA)

| ID | Name | Description | Input: limit | Calculated: effective limit | Expected Output |
|---|---|---|---|---|---|
| TC-01 | Missing limit | ไม่ส่งมา ได้ default 5 | null | 5 | Valid - accepted |
| TC-02 | Zero falls back | limit 0 ต่ำไป กลับเป็น default | 0 | 5 | Valid - accepted (fallback) |
| TC-03 | Minimum 1 | ขอน้อยสุด ได้ 1 | 1 | 1 | Valid - accepted |
| TC-04 | Just above min | 2 ได้ 2 | 2 | 2 | Valid - accepted |
| TC-05 | Below max 49 | 49 ได้ 49 | 49 | 49 | Valid - accepted |
| TC-06 | Maximum 50 | 50 ได้ 50 | 50 | 50 | Valid - accepted |
| TC-07 | Over max clamps | 51 โดน clamp เหลือ 50 | 51 | 50 | Valid - accepted (clamped) |
| TC-08 | Huge clamps | 999 โดน clamp เหลือ 50 | 999 | 50 | Valid - accepted (clamped) |
| TC-09 | Negative falls back | -5 กลับเป็น default | -5 | 5 | Valid - accepted (fallback) |
| TC-10 | Non-numeric falls back | "abc" กลับเป็น default | abc | 5 | Valid - accepted (fallback) |

| ID | Name | Description | Input: limit | Expected Output |
|---|---|---|---|---|
| BT-01 | Dashboard default widget | หน้า dashboard ขอ 5 ออเดอร์ล่าสุด | null (default) | Valid - accepted, ได้ 5 แถว |
| BT-02 | Admin expands list | แอดมินขอดู 20 แถว | 20 | Valid - accepted |
| BT-03 | Typo huge number | แอดมินพิมพ์ 1000 มา ระบบกันไว้ที่ 50 | 1000 | Valid - accepted (clamped 50) |

## C2 RouteId (EP)

| ID | Name | Description | Input: RouteId | Expected Output |
|---|---|---|---|---|
| TC-11 | Valid id | id ปกติ | 10 | Valid - accepted (10) |
| TC-12 | Zero invalid | 0 ไม่ใช่จำนวนเต็มบวก | 0 | Invalid - rejected (null) |
| TC-13 | Negative invalid | -3 ไม่ใช่จำนวนเต็มบวก | -3 | Invalid - rejected (null) |
| TC-14 | Non-numeric | "abc" ไม่ใช่ตัวเลข | abc | Invalid - rejected (null) |
| TC-15 | Missing | ไม่ส่งมา | undefined | Invalid - rejected (null) |

## C3+C4 Status/Total (EP + BVA)

| ID | Name | Description | Input: Status (DB) | Input: TotalAmount (DB) | Calculated: shown | Expected Output |
|---|---|---|---|---|---|---|
| TC-16 | Normal paid order | ออเดอร์ปกติ | paid | 1290 | paid / 1290 | Valid - accepted |
| TC-17 | Null status unknown | status null แสดง unknown | null | 500 | unknown / 500 | Valid - accepted (fallback) |
| TC-18 | Null total zero | ยอด null แสดง 0 | shipped | null | shipped / 0 | Valid - accepted (fallback) |
| TC-19 | Null date | วันที่ null แสดง null (ไม่ crash) | pending | 100 | date null | Valid - accepted |
| TC-20 | No customer name | ลูกค้าไม่มีชื่อ แสดง "ไม่ระบุชื่อ" | pending (no customer) | 100 | ไม่ระบุชื่อ | Valid - accepted |

| ID | Name | Description | Input: Status | Input: Total | Expected Output |
|---|---|---|---|---|---|
| BT-04 | Recent COD order | ออเดอร์เก็บเงินปลายทางเมื่อเช้า | pending / 890 | Valid - accepted |
| BT-05 | Legacy broken row | แถวเก่าข้อมูลไม่ครบ แสดง fallback ไม่พัง | null / null | Valid - accepted (unknown / 0) |
