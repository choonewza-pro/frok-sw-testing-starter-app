# TEST_1.5 Contact Us (P0, Risk 15 High)

* Route: `/contact` (`src/app/(front)/contact/page.tsx`, `contact-form.tsx:112-192`)
* Spec: `e2e/contact.spec.ts` — public
* Sources: `src/lib/contact-schema.ts:3-24`, `src/lib/contact/email-sender.ts:35`

## Preconditions

* ไม่ต้อง login; mock Resend ฝั่ง UI (ห้ามส่งเมลจริงใน CI)

## Cases

| ID | ชื่อ | Steps | Locators | Assert |
|---|---|---|---|---|
| T1 | `sends message when valid` | fill name≥2/subject≥3/message≥10/email ถูก → `contact-submit` | `contact-form/contact-name/email/subject/message/submit` | `contact-success` visible |
| T2 | `shows field errors when required invalid` | submit ว่าง / email ผิด / message 9 ตัว | `FieldError` ราย field | error ราย field visible + ไม่เห็น `contact-success` |
| T3 | `shows error when sender fails` | `page.route('**/api/contact**', 500)` → submit valid | `contact-error` | `contact-error` visible |
| T4 | `blocks honeypot silently` | ถ้ามี field `website` ซ่อน → กรอก + submit (ทำเฉพาะถ้ามี field จริง) | honeypot | ไม่เห็น success/error แบบปกติ (กันบอท) |

## Isolation

* T3 ใช้ `page.route` mock ระดับ test ไม่กระทบเคสอื่น
* ไม่ assert ข้อความ success ตายตัวทั้งประโยค (i18n เปลี่ยนได้) assert แค่ visible

## Out of scope

* BVA name 2/100, subject 3/150, message 10/2000 (TC ละเอียด) — `contactSchema` unit (`test-cases/contact-us.md`)

## Traceability

* `test-cases/contact-us.md`, Risk #6
