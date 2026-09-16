# Test Cases — Course Catalog (EP)

Sources: `src/lib/course/course-api.ts:22-68`, `src/lib/course/course-schema.ts:7-18`

## Input Analysis

- C1 HTTP status — ok vs 4xx/5xx → EP
- C2 Body format — JSON vs non-JSON vs schemaผิด → EP
- C3 Network/timeout — throw/abort → EP

| ID | Name | Description | Input: HTTP | Input: Body | Expected Output |
|---|---|---|---|---|---|
| TC-01 | Valid course list | API ตอบ 200 + schema ถูก | 200 ok | {data:[{id,title,detail,date,view,picture:url}]} | Valid - accepted (return list) |
| TC-02 | Empty list | ไม่มีคอร์ส ได้ [] | 200 ok | {data:[]} | Valid - accepted (empty) |
| TC-03 | Server error | API 500 โยน CourseApiError | 500 | - | Invalid - rejected (throw) |
| TC-04 | Not found | API 404 โยน CourseApiError | 404 | - | Invalid - rejected (throw) |
| TC-05 | Non-JSON body | ตอบไม่ใช่ JSON โยน error | 200 ok | `<html>...` | Invalid - rejected (throw) |
| TC-06 | Missing field | ขาด picture Url validation ตก โยน error | 200 ok | {data:[{id,title (no picture)}]} | Invalid - rejected (throw) |
| TC-07 | Wrong picture type | picture ไม่ใช่ URL โยน error | 200 ok | picture:"not-a-url" | Invalid - rejected (throw) |
| TC-08 | Network down | fetch throw (เน็ตล่ม) โยน error | throw | - | Invalid - rejected (throw) |
| TC-09 | Timeout abort | เกิน 10s AbortSignal โยน error | timeout | - | Invalid - rejected (throw) |

| ID | Name | Description | Input: Scenario | Expected Output |
|---|---|---|---|---|
| BT-01 | Normal course browse | นักเรียนเปิดหน้าคอร์ส เน็ตปกติ | 200 + 10 คอร์ส | Valid - accepted |
| BT-02 | API deploy breaks schema | ฝั่ง codingthailand deploy แล้ว schema เปลี่ยน | 200 + field หาย | Invalid - rejected (โชว์ fallback UI) |
| BT-03 | Offline cafe wifi | เน็ตร้านกาแฟหลุด | throw | Invalid - rejected (โชว์ error) |
