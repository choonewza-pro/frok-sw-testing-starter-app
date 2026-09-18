/**
 * ข้อมูลบัญชีทดสอบกลาง — ตรงกับ TEST_1.0_overview.md
 * verify แล้วว่ามีใน prisma/dev.db (SELECT readonly 2026-09-17)
 * override ผ่าน env ได้สำหรับ CI (ไม่ commit รหัสจริงลง repo)
 */
export const ADMIN_AUTH_FILE = "playwright/.auth/admin.json";
export const USER_AUTH_FILE = "playwright/.auth/user.json";

export const E2E_USERS = {
  admin: {
    email: process.env.E2E_ADMIN_EMAIL || "admin@test.com",
    password: process.env.E2E_ADMIN_PASSWORD || "12345678",
  },
  user: {
    email: process.env.E2E_USER_EMAIL || "user@test.com",
    password: process.env.E2E_USER_PASSWORD || "12345678",
  },
} as const;

/** email unique กันชนตอนรัน parallel */
export function uniqueEmail(prefix = "e2e"): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.com`;
}
