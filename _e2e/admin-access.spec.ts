import { test, expect } from "./fixtures";

/**
 * TEST_1.2 Admin Access guard (P0, Risk 25)
 * ตรวจ requireAdmin() 3 เส้น: anonymous -> /login, user -> /, admin -> ผ่าน
 */
test.describe("Admin access control", () => {
  test("redirects to /login when anonymous visits /admin", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId("dashboard")).toBeHidden();
  });

  test("redirects to /login when anonymous visits /admin/products", async ({ page }) => {
    await page.goto("/admin/products");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId("products-admin")).toBeHidden();
  });

  test("redirects to / when user visits /admin", async ({ userPage }) => {
    await userPage.goto("/admin");
    await expect(userPage).toHaveURL(/\/$/);
    await expect(userPage.getByTestId("dashboard")).toBeHidden();
  });

  test("redirects to / when user visits /admin/products", async ({ userPage }) => {
    await userPage.goto("/admin/products");
    await expect(userPage).toHaveURL(/\/$/);
    await expect(userPage.getByTestId("products-admin")).toBeHidden();
  });

  test("shows dashboard when admin visits /admin", async ({ adminPage }) => {
    await adminPage.goto("/admin");
    await expect(adminPage.getByTestId("dashboard")).toBeVisible();
    await expect(adminPage.getByTestId("kpi-orders")).toBeVisible();
  });

  test("shows products admin when admin visits /admin/products", async ({ adminPage }) => {
    await adminPage.goto("/admin/products");
    await expect(adminPage.getByTestId("products-admin")).toBeVisible();
    await expect(adminPage.getByTestId("product-create")).toBeVisible();
  });

  test("navigates between dashboard and products via admin nav", async ({ adminPage }) => {
    await adminPage.goto("/admin");
    await adminPage.getByTestId("admin-nav-products").click();
    await expect(adminPage).toHaveURL(/\/admin\/products/);

    await adminPage.getByTestId("admin-nav-dashboard").click();
    await expect(adminPage).toHaveURL(/\/admin\/?$/);
  });
});
