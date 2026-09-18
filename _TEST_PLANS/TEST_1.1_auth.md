# TEST_1.1 Auth — signup/login/logout (P0, Risk 25 Critical)

* Route: `/signup`, `/login`, `/` (navbar)
* Spec: `e2e/auth.spec.ts` — **fresh context ทุกเคส ห้ามใช้ storageState**
* Sources: `src/lib/auth-schema.ts:12-45`, `src/lib/auth.ts:17-22`, `src/app/(auth)/login/page.tsx:61-111`, `src/app/(auth)/signup/page.tsx:64-158`

## Preconditions

* `admin@test.com` / `user@test.com` มีใน `dev.db` แล้ว (verify 2026-09-17)
* signup ใหม่ใช้ `e2e-${Date.now()}@test.com` (unique, parallel-safe)

## Cases

| ID | ชื่อ `[expected when scenario]` | Steps | Locators | Assert (web-first) |
|---|---|---|---|---|
| A1 | `logs in and shows user menu when admin credentials valid` | goto `/login` → fill email `admin@test.com` / pass `12345678` → submit | `login-email/login-password/login-submit` (`login/page.tsx:72,95,111`) | `toHaveURL(/.*\/$/)` + `nav-user-name` visible |
| A2 | `logs in when user credentials valid` | เหมือน A1 ด้วย `user@test.com` | เดียวกัน | เดียวกัน |
| A3 | `shows error toast when password invalid` | `admin@test.com` + `wrong1234` → submit | `login-submit` + toast | error toast visible, ยังอยู่ `/login` |
| A4 | `shows validation error when password too short` | fill pass `123` → submit | `login-password` + `FieldError` | text `รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร` visible |
| A5 | `shows validation error when confirm mismatch` | goto `/signup` → fill name/email/pass `Suda2026` / confirm `Suda2025` → submit | `signup-name/email/password/confirm-password/submit` | text `รหัสผ่านไม่ตรงกัน` visible |
| A6 | `creates user role and denies admin when signup valid` | signup email ใหม่ pass `Suda1234` → redirect `/login` → login → `goto('/admin')` | `signup-submit` + toast `สมัครสมาชิกสำเร็จ` | สุดท้าย `toHaveURL` เป็น `/` ไม่ใช่ `/admin` (พิสูจน์ `input:false`) |
| A7 | `logs out and clears session when logout clicked` | login `user@test.com` (fresh context) → click logout | `logout-button` (`logout-button.tsx:21`) → `nav-login` | `nav-login` visible + `goto('/admin')` → `/login` |

## Isolation/Cleanup

* A6 สร้าง user ใหม่ทุกครั้ง — ไม่ต้องลบ (เป็นหลักฐาน role) แต่ต้อง unique
* A7 รันแยก `describe.serial` ไม่แชร์ context กับเคสอื่น

## Out of scope (ไป unit)

* email 6 partitions (TC-01..06), name 2-50 (TC-12..17), role ADMIN/case-sensitive (TC-22..27) — อยู่ใน `test-cases/auth-admin-access-control.md` ให้เป็น Vitest `loginSchema/registerSchema/isAdmin()`

## Traceability

* ST-01..09, SJ-01..05 ใน `test-cases/auth-admin-access-control.md`
* `requireAdmin()` 3 ทาง test ใน TEST_1.2
