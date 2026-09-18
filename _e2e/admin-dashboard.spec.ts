import { test, expect } from "./fixtures";

/**
 * TEST_1.7 Admin Dashboard (P1, Risk 12)
 * แต่ละ section ดึง API ของตัวเองแยกกัน (stats/revenue/orders) — error ที่หนึ่งไม่ล่มทั้งหน้า
 */
test.describe("Admin dashboard", () => {
  test("shows KPI revenue and recent orders when admin visits", async ({ adminPage }) => {
    await adminPage.goto("/admin");

    await expect(adminPage.getByTestId("dashboard")).toBeVisible();
    await expect(adminPage.getByTestId("kpi-orders")).toBeVisible();
    await expect(adminPage.getByTestId("kpi-revenue")).toBeVisible();
    await expect(adminPage.getByTestId("kpi-orders-value")).not.toBeEmpty();
    await expect(adminPage.getByTestId("revenue-card")).toBeVisible();
    await expect(adminPage.getByTestId("revenue-total")).not.toBeEmpty();
    await expect(adminPage.getByTestId("recent-orders-card")).toBeVisible();
  });

  test("shows recent orders with totals", async ({ adminPage }) => {
    await adminPage.goto("/admin");

    const rows = adminPage.getByTestId("recent-order-row");
    await expect(rows.first()).toBeVisible();
    await expect(adminPage.getByTestId("recent-order-total").first()).not.toBeEmpty();
  });

  test("changes revenue request when period changed", async ({ adminPage }) => {
    await adminPage.goto("/admin");
    await expect(adminPage.getByTestId("revenue-card")).toBeVisible();

    const responsePromise = adminPage.waitForResponse(
      (res) => res.url().includes("/api/admin/revenue?period=7d") && res.ok(),
    );
    await adminPage.getByTestId("period-7d").click();
    await responsePromise;

    await expect(adminPage.getByTestId("revenue-total")).not.toBeEmpty();
  });

  test("shows empty state when no orders", async ({ adminPage }) => {
    await adminPage.route("**/api/admin/orders**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ orders: [] }),
      }),
    );

    await adminPage.goto("/admin");

    await expect(adminPage.getByTestId("recent-orders-empty")).toBeVisible();
    await expect(adminPage.getByTestId("recent-order-row")).toHaveCount(0);
  });

  test("recovers after retry when stats failed", async ({ adminPage }) => {
    // StrictMode ใน dev ยิง effect ซ้ำ (request แรกโดน abort) จึงใช้ flag
    // แทนการนับครั้ง — ไม่งั้น request ที่ abort จะกินโควตา fail ไป
    let shouldFail = true;
    await adminPage.route("**/api/admin/stats", (route) =>
      shouldFail
        ? route.fulfill({ status: 500, contentType: "application/json", body: "{}" })
        : route.continue(),
    );

    await adminPage.goto("/admin");

    await expect(adminPage.getByTestId("stats-error")).toBeVisible();
    // retry ตอน server ยังพัง -> ยัง error (พิสูจน์ว่าปุ่มยิงใหม่จริง)
    await adminPage.getByTestId("stats-retry").click();
    await expect(adminPage.getByTestId("stats-error")).toBeVisible();

    shouldFail = false;
    await adminPage.getByTestId("stats-retry").click();
    await expect(adminPage.getByTestId("kpi-orders")).toBeVisible();
  });
});
