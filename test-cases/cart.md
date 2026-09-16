# Test Cases — Cart (BVA + EP)

Sources: `src/lib/cart/cart-logic.ts:10-50`

## Input Analysis

- C1 add qty — <=0 ignore → BVA
- C2 update qty — <=0 remove → BVA
- C3 productId exists/missing → EP
- C4 totals — sum → BVA

| ID | Name | Description | Input: Items | Input: Qty/ProductId | Calculated | Expected Output |
|---|---|---|---|---|---|
| TC-01 | Add new item | เพิ่มของใหม่เข้าตะกร้าว่าง | [] | id 1 qty 2 price 100 | items 1, total 2/200 | Valid - accepted |
| TC-02 | Add zero ignored | qty 0 ไม่เพิ่ม | [{1,qty2}] | id 2 qty 0 | unchanged | Valid - accepted (ignored) |
| TC-03 | Add negative ignored | qty ลบ ไม่เพิ่ม | [{1,qty2}] | id 2 qty -1 | unchanged | Valid - accepted (ignored) |
| TC-04 | Add same sums | ของซ้ำบวกจำนวน | [{1,qty2}] | id 1 qty 3 | qty 5 | Valid - accepted |
| TC-05 | Update to 5 | แก้จำนวนเป็น 5 | [{1,qty2}] | id 1 → 5 | qty 5 | Valid - accepted |
| TC-06 | Update zero removes | แก้เป็น 0 หลุดจากตะกร้า | [{1,qty2}] | id 1 → 0 | removed | Valid - accepted (removed) |
| TC-07 | Update negative removes | แก้ติดลบ หลุดจากตะกร้า | [{1,qty2}] | id 1 → -2 | removed | Valid - accepted (removed) |
| TC-08 | Update missing id | แก้ id ไม่มี ไม่เปลี่ยน | [{1,qty2}] | id 99 → 5 | unchanged | Valid - accepted (no-op) |
| TC-09 | Remove existing | ลบของที่มี | [{1},{2}] | remove 1 | left [{2}] | Valid - accepted |
| TC-10 | Remove missing | ลบของไม่มี ไม่เปลี่ยน | [{1}] | remove 99 | unchanged | Valid - accepted |
| TC-11 | Clear cart | ล้างทั้งหมด | [{1},{2}] | clear | [] | Valid - accepted |
| TC-12 | Totals sum | รวม 2แถว: 2x100 + 1x250 | [{100x2},{250x1}] | - | items 3 / price 450 | Valid - accepted |
| TC-13 | Line total | แถวเดียว 3x199 | {199x3} | - | 597 | Valid - accepted |
| TC-14 | Empty totals zero | ตะกร้าว่างรวมเป็น 0 | [] | - | 0 / 0 | Valid - accepted |

| ID | Name | Description | Input: Scenario | Expected Output |
|---|---|---|---|---|
| BT-01 | Shopper adds 2 phones | ลูกค้าหยิบมือถือ 2 เครื่อง | id 7 qty 2 x12900 | Valid - accepted (25800) |
| BT-02 | Change mind to 1 | เปลี่ยนใจเหลือ 1 เครื่อง | update → 1 | Valid - accepted |
| BT-03 | Remove by zero | กดลบเหลือ 0 ของหาย | update → 0 | Valid - accepted (removed) |
| BT-04 | Double-click add | กดเพิ่มรัวๆ ของซ้ำบวกกัน | add 1 + add 1 | Valid - accepted (qty 2) |
