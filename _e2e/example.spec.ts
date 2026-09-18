import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("renders main content when visiting /", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("main")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /หลักสูตร|ดูหลักสูตร/i }).first(),
    ).toBeVisible();
  });
});
