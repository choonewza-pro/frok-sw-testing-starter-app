# Test Cases — Dashboard Reporting (BVA + EP)

Sources: `src/lib/admin/stats.ts:20-36`, `src/lib/admin/revenue.ts:20-41`, `src/lib/admin/period.ts:15-36`

## Input Analysis

- C1 Stats counts → BVA (orderCount 0 → avg 0, revenueSum null→0)
- C2 Revenue null/date null → EP
- C3 Period enum 7d/30d/90d → EP

| ID | Name | Description | Input: orderCount | Input: revenueSum | Calculated: avg/total | Expected Output |
|---|---|---|---|---|---|
| TC-01 | Empty store | ไม่มีออเดอร์ avg ต้อง 0 ไม่ใช่ NaN | 0 | null | total 0 / avg 0 | Valid - accepted |
| TC-02 | Single order | 1 ออเดอร์ 1000 avg 1000 | 1 | 1000 | avg 1000 | Valid - accepted |
| TC-03 | Normal day | 4 ออเดอร์รวม 5000 avg 1250 | 4 | 5000 | avg 1250 | Valid - accepted |
| TC-04 | Zero revenue orders | มีออเดอร์แต่ยอด null→0 | 3 | null | total 0 / avg 0 | Valid - accepted |
| TC-05 | Revenue gap filled | 7 วันมีขาย 2 วัน วันที่เหลือ 0 (กราฟไม่ข้าม) | orders 2 ใน 7 วัน | - | series 7 จุด (5 จุดเป็น 0) | Valid - accepted |
| TC-06 | Null date skipped | ออเดอร์ date null ถูกข้าม | date null | 500 | ไม่นับ | Valid - accepted |
| TC-07 | Null amount zero | amount null นับเป็น 0 | valid date | null | +0 | Valid - accepted |
| TC-08 | Period valid | 7d/30d/90d รับ | 7d / 30d / 90d | - | 7/30/90 วัน | Valid - accepted |
| TC-09 | Period invalid default | "14d"/null/"abc" กลับเป็น 30d | 14d | - | 30 วัน | Valid - accepted |

| ID | Name | Description | Input: Scenario | Expected Output |
|---|---|---|---|---|
| BT-01 | New shop no sales | ร้านเปิดใหม่ยังขายไม่ได้ | 0 orders | Valid - accepted (0 ทุกช่อง) |
| BT-02 | Weekday sales | ขายได้จ-ศ เสาร์อาทิตย์เงียบ | 5 orders / 7d | Valid - accepted (2 จุดเป็น 0) |
