import { test } from "@playwright/test";

test("verify logo is visible on home page", async ({ page }) => {
  await page.goto("/");
  // เคยใช้ alt "โลโก้ Next.js1" ซึ่งไม่มีอยู่จริง (logo.tsx ใช้ "โลโก้ Next.js")
  const logo = page.getByRole("img", { name: "โลโก้ Next.js" });
  await test.expect(logo).toBeVisible();
})