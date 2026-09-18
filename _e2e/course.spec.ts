import { test, expect } from "@playwright/test";

/**
 * TEST_1.8 Course Catalog (P1, Risk 15)
 *
 * Implementation note: หน้า /course fetch ฝั่ง server จึงดักด้วย page.route() ไม่ได้
 * เลยใช้ mock server (e2e/helpers/course-mock-server.mjs, fixture docs/fixtures/courses.json
 * 3 รายการ) + สลับ mode ผ่าน POST /__control — serial เท่านั้นกัน mode ชนกัน
 */
const MOCK_BASE = "http://127.0.0.1:3939";

async function setCourseMode(mode: "ok" | "empty" | "error"): Promise<void> {
  const res = await fetch(`${MOCK_BASE}/__control`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode }),
  });
  if (!res.ok) test.skip(true, "mock course server ไม่พร้อม — ตรวจว่า global-setup รันแล้ว");
}

test.describe.serial("Course catalog", () => {
  test("shows course list from mock when API succeeds", async ({ page }) => {
    await setCourseMode("ok");
    await page.goto("/course");

    await expect(page.getByTestId("course-list")).toBeVisible();
    await expect(page.getByTestId("course-card")).toHaveCount(3);
    await expect(page.getByTestId("course-error")).toBeHidden();
  });

  test("shows empty state when API returns no courses", async ({ page }) => {
    await setCourseMode("empty");
    await page.goto("/course");

    await expect(page.getByTestId("course-empty")).toBeVisible();
    await expect(page.getByTestId("course-list")).toBeHidden();
  });

  test("shows error message when API fails", async ({ page }) => {
    await setCourseMode("error");
    await page.goto("/course");

    await expect(page.getByTestId("course-error")).toBeVisible();
    await expect(page.getByTestId("course-list")).toBeHidden();

    await setCourseMode("ok");
  });
});
