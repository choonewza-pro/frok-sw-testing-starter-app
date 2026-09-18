# TEST_1.8 Course Catalog (P1, Risk 15 High)

* Route: `/course` (`src/app/(front)/course/page.tsx:10-28`)
* Spec: `e2e/course.spec.ts` — public ไม่ต้อง login
* Sources: `src/components/features-course.tsx:23-43`, `src/lib/course/course-api.ts` (`fetchCourses`, `CourseApiError`, `AbortSignal.timeout`)

## Preconditions

* API นอก `api.codingthailand.com` อาจช้า/เปลี่ยน schema — happy path ยิงจริงได้ 1 ครั้ง ที่เหลือ mock

## Cases

| ID | ชื่อ | Steps | Locators | Assert |
|---|---|---|---|---|
| S1 | `shows course list when API succeeds` | `goto('/course')` (ยิงจริงหรือ mock fixture ปกติ) | `course-list/course-card` | card > 0 |
| S2 | `shows error message when API fails` | `page.route('**/api.codingthailand.com/**', abort)` → `goto('/course')` | `course-error` | error visible + ไม่เห็น `course-list` |
| S3 | `shows empty state when API returns empty` | `page.route(..., [])` → reload | `course-empty` | empty visible |
| S4 | `recovers after retry when API back online` | abort แล้ว restore → reload | `course-list` | กลับมาเห็น list (ถ้ามีปุ่ม retry ให้กด) |

## Implementation note (2026-09-17)

* `page.route()` ดัก server-side fetch ไม่ได้ จึงใช้ mock server
  (`e2e/helpers/course-mock-server.mjs` + `e2e/global-setup.ts` + `COURSE_API_URL` ใน `webServer.env`)
  สลับ mode ผ่าน `POST 127.0.0.1:3939/__control` — spec นี้ต้อง `serial` เท่านั้น
* S4 (recover) ตัดออก — แทนด้วยการ reset mode `ok` ท้ายเคส error

## Isolation

* S2-S4 mock network ระดับ test ไม่กระทบ S1
* ห้าม assert ชื่อ/จำนวน course ตายตัว — API นอกเปลี่ยนได้ตลอด

## Out of scope

* EP schema (ขาด field, picture ไม่ใช่ URL, `response.ok=false`, throw) + timeoutMs — `fetchCourses` unit (`test-cases/course-catalog.md`)

## Traceability

* `test-cases/course-catalog.md`, Risk #5
