import { test, expect } from "@playwright/test";
import { E2E_USERS, uniqueEmail } from "./helpers/test-users";
import { LoginPage } from "./pages/login.page";

/**
 * TEST_1.1 Auth — signup/login/logout (P0, Risk 25)
 * ใช้ fresh context ทุกเคส ห้ามใช้ storageState (ไฟล์นี้คือตัวทดสอบ auth เอง)
 */
test.describe("Auth", () => {
  test("logs in and shows user menu when admin credentials valid", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(E2E_USERS.admin.email, E2E_USERS.admin.password);

    await expect(login.userName).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test("logs in when user credentials valid", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(E2E_USERS.user.email, E2E_USERS.user.password);

    await expect(login.userName).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test("shows error toast and stays on login when password invalid", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(E2E_USERS.admin.email, "wrong-password-123");

    await expect(page.locator(".Toastify__toast--error")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
    await expect(login.userName).toBeHidden();
  });

  test("shows validation error when password too short", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(E2E_USERS.user.email, "123");

    await expect(page.getByText("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows validation error when confirm password mismatches", async ({ page }) => {
    await page.goto("/signup");
    await page.getByTestId("signup-name").fill("สุดา แก้วใส");
    await page.getByTestId("signup-email").fill(uniqueEmail("mismatch"));
    await page.getByTestId("signup-password").fill("Suda2026!");
    await page.getByTestId("signup-confirm-password").fill("Suda2025!");
    await page.getByTestId("signup-submit").click();

    await expect(page.getByText("รหัสผ่านไม่ตรงกัน")).toBeVisible();
    await expect(page).toHaveURL(/\/signup/);
  });

  test("creates user role and denies admin page when signup valid", async ({ page }) => {
    const email = uniqueEmail("newuser");
    await page.goto("/signup");
    await page.getByTestId("signup-name").fill("ผู้ใช้ทดสอบ");
    await page.getByTestId("signup-email").fill(email);
    await page.getByTestId("signup-password").fill("Suda1234!");
    await page.getByTestId("signup-confirm-password").fill("Suda1234!");
    await page.getByTestId("signup-submit").click();

    // สมัครสำเร็จ -> กลับไปหน้า login (setTimeout 1200ms ใน signup/page.tsx)
    await expect(page).toHaveURL(/\/login/);

    const login = new LoginPage(page);
    await login.login(email, "Suda1234!");
    await expect(login.userName).toBeVisible();

    // role เริ่มต้นต้องเป็น user (input:false) -> เข้า /admin โดนดีดกลับหน้าร้าน
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId("dashboard")).toBeHidden();
  });

  test.describe.serial("logout", () => {
    test("logs out and clears session when logout clicked", async ({ page }) => {
      const login = new LoginPage(page);
      await login.goto();
      await login.login(E2E_USERS.user.email, E2E_USERS.user.password);
      await expect(login.userName).toBeVisible();

      // รอ sign-out POST สำเร็จก่อน reload — ไม่งั้น reload จะแข่งกับ request
      // (navigation ยกเลิก in-flight POST -> session ไม่หลุด -> flaky)
      const [signOutResponse] = await Promise.all([
        page.waitForResponse(
          (res) =>
            res.url().includes("/api/auth/sign-out") && res.request().method() === "POST",
        ),
        page.getByTestId("logout-button").click(),
      ]);
      expect(signOutResponse.ok()).toBe(true);

      // Known app limitation: LogoutButton ใช้ router.refresh() ซึ่งไม่ re-render
      // Navbar (server component) ใน dev — session ถูกเคลียร์แล้ว แต่ต้อง reload
      // หน้าเว็บถึงจะแสดงสถานะ logged-out จึง reload เพื่อ assert ผลลัพธ์ที่ durable
      await page.reload();
      await expect(login.loginLink).toBeVisible();

      await page.goto("/admin");
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
