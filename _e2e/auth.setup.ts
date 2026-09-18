import { test as setup, expect, type Page } from "@playwright/test";
import { ADMIN_AUTH_FILE, E2E_USERS, USER_AUTH_FILE } from "./helpers/test-users";

/**
 * Login ผ่าน UI ครั้งเดียวแล้ว reuse ผ่าน storageState (ไม่ login ซ้ำทุกเคส)
 * รันเป็น project "setup" ก่อน chromium เสมอ (dependencies ใน playwright.config.ts)
 *
 * หมายเหตุ: หน้า login redirect ช้าหน่อย (setTimeout 1200ms ใน login/page.tsx)
 * web-first assertions จะ retry ให้เอง ห้ามใส่ waitForTimeout
 */
async function loginAndSave(
  page: Page,
  email: string,
  password: string,
  storagePath: string,
): Promise<void> {
  await page.goto("/login");
  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();

  // session cookie เซ็ตแล้ว + navbar (server component) render ชื่อผู้ใช้
  await expect(page.getByTestId("nav-user-name")).toBeVisible();
  await page.context().storageState({ path: storagePath });
}

setup("authenticate as admin", async ({ page }) => {
  await loginAndSave(page, E2E_USERS.admin.email, E2E_USERS.admin.password, ADMIN_AUTH_FILE);
});

setup("authenticate as user", async ({ page }) => {
  await loginAndSave(page, E2E_USERS.user.email, E2E_USERS.user.password, USER_AUTH_FILE);
});
