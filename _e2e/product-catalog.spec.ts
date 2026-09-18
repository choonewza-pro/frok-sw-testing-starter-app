import { test, expect } from "@playwright/test";

/**
 * TEST_1.3 Product Catalog (P0, Risk 15)
 * public route — ไม่ต้อง login, อ่านอย่างเดียว
 */
test.describe("Product catalog", () => {
  test("shows product list when visiting /product", async ({ page }) => {
    await page.goto("/product");

    await expect(page.getByTestId("product-list")).toBeVisible();
    expect(await page.getByTestId("product-card").count()).toBeGreaterThan(0);
  });

  test("filters results when searching by existing keyword", async ({ page }) => {
    await page.goto("/product");

    // อ่านชื่อสินค้าจริงจากหน้าเว็บก่อน แล้วค้นด้วยคำนั้น — ไม่ hardcode คำค้น
    const firstName = (await page.getByTestId("product-name").first().innerText()).trim();
    const keyword = firstName
      .replace(/^Name:\s*/i, "")
      .split(/\s+/)
      .find((w) => w.length >= 4);
    test.skip(!keyword, "no searchable product name on page");

    const before = await page.getByTestId("product-card").count();

    await page.getByTestId("product-search-input").fill(keyword!);
    await page.getByTestId("product-search-submit").click();

    await expect(page).toHaveURL(new RegExp(`q=${encodeURIComponent(keyword!)}`));
    const after = await page.getByTestId("product-card").count();
    expect(after).toBeGreaterThan(0);
    expect(after).toBeLessThanOrEqual(before);
  });

  test("shows empty state when no product matches", async ({ page }) => {
    await page.goto("/product");

    await page.getByTestId("product-search-input").fill("zzz-no-such-product-999");
    await page.getByTestId("product-search-submit").click();

    await expect(page.getByTestId("product-empty")).toBeVisible();
    await expect(page.getByTestId("product-card")).toHaveCount(0);
  });

  test("navigates between pages when pagination clicked", async ({ page }) => {
    await page.goto("/product");

    const status = page.getByTestId("product-pagination-status");
    await expect(status).toBeVisible();
    const match = (await status.innerText()).match(/หน้า\s+(\d+)\s+จาก\s+(\d+)/);
    test.skip(!match, "unexpected pagination status format");
    const totalPages = Number(match![2]);

    if (totalPages <= 1) {
      await expect(page.getByTestId("product-next-page")).toBeDisabled();
      return;
    }

    await page.getByTestId("product-next-page").click();
    await expect(page.getByTestId("product-pagination-status")).toContainText("หน้า 2 จาก");

    await page.getByTestId("product-prev-page").click();
    await expect(page.getByTestId("product-pagination-status")).toContainText("หน้า 1 จาก");
  });

  test("keeps search keyword when paginating", async ({ page }) => {
    await page.goto("/product");
    const status = (await page.getByTestId("product-pagination-status").innerText()).trim();
    const totalPages = Number(status.match(/จาก\s+(\d+)/)?.[1] ?? 1);
    test.skip(totalPages <= 1, "needs more than 1 page");

    await page.getByTestId("product-search-input").fill("a");
    await page.getByTestId("product-search-submit").click();
    await expect(page).toHaveURL(/q=a/);

    const afterSearch = (await page.getByTestId("product-pagination-status").innerText()).trim();
    const searchPages = Number(afterSearch.match(/จาก\s+(\d+)/)?.[1] ?? 1);
    test.skip(searchPages <= 1, "search result has only 1 page");

    await page.getByTestId("product-next-page").click();
    await expect(page).toHaveURL(/q=a/);
    await expect(page).toHaveURL(/page=2/);
  });
});
