import { test, expect } from "./fixtures";
import { AdminProductsPage } from "./pages/admin-products.page";

/**
 * TEST_1.6 Admin Product CRUD (P1, Risk 20)
 * ใช้ adminPage (storageState) อย่างเดียว — serial เพราะ create/edit/delete ใช้ row เดียวกัน
 *
 * product id=2 (Samsung Galaxy S25) มี order_items 13 rows (verify จาก dev.db)
 * จึงใช้เป็นเคส 409 delete-blocked ได้อย่างปลอดภัย
 */
test.describe.serial("Admin product CRUD", () => {
  const productName = `E2E-${Date.now()}`;

  test("creates product when valid", async ({ adminPage }) => {
    const products = new AdminProductsPage(adminPage);
    await products.goto();
    await expect(products.root).toBeVisible();

    await products.createProduct(productName, "1999");
    await expect(products.dialog).toBeHidden();
    await expect(products.rowByName(productName)).toBeVisible();
  });

  test("shows validation when price invalid", async ({ adminPage }) => {
    const products = new AdminProductsPage(adminPage);
    await products.goto();

    await products.createButton.click();
    await products.nameInput.fill(`E2E-invalid-${Date.now()}`);
    // price 0 (ค่าว่าง) + ไม่เลือกหมวดหมู่ -> schema ต้องปฏิเสธ
    await products.submitButton.click();

    await expect(products.dialog).toBeVisible();
    await expect(products.rowByName(productName)).toBeVisible();
    await adminPage.keyboard.press("Escape");
  });

  test("edits price when edit clicked", async ({ adminPage }) => {
    const products = new AdminProductsPage(adminPage);
    await products.goto();

    const row = products.rowByName(productName);
    await expect(row).toBeVisible();
    await row.getByTestId("product-edit").click();

    await expect(products.dialog).toBeVisible();
    await products.priceInput.fill("2999");
    await products.submitButton.click();

    await expect(products.dialog).toBeHidden();
    await expect(products.rowByName(productName)).toContainText("2,999");
  });

  test("cancels delete when cancel clicked", async ({ adminPage }) => {
    const products = new AdminProductsPage(adminPage);
    await products.goto();

    const row = products.rowByName(productName);
    await row.getByTestId("product-delete").click();
    await expect(adminPage.getByTestId("delete-dialog")).toBeVisible();

    await adminPage.getByTestId("delete-cancel").click();
    await expect(adminPage.getByTestId("delete-dialog")).toBeHidden();
    await expect(products.rowByName(productName)).toBeVisible();
  });

  test("deletes product when confirm clicked", async ({ adminPage }) => {
    const products = new AdminProductsPage(adminPage);
    await products.goto();

    const row = products.rowByName(productName);
    await row.getByTestId("product-delete").click();
    await adminPage.getByTestId("delete-confirm").click();

    await expect(adminPage.getByTestId("delete-dialog")).toBeHidden();
    await expect(products.rowByName(productName)).toHaveCount(0);
  });

  test("blocks delete when product has order items (409)", async ({ adminPage }) => {
    const products = new AdminProductsPage(adminPage);
    await products.goto();

    // ตารางมี pagination (id=2 ไม่ได้อยู่หน้าแรกเสมอ) -> search ก่อนให้ row โผล่
    // debounce 400ms — web-first assertion retry ให้เอง
    await products.search.fill("Samsung");

    // product id=2 ถูกอ้างโดย order_items 13 rows -> API ต้องปฏิเสธ (dialog ค้าง + toast error)
    const row = products.rowByProductId(2);
    await expect(row).toBeVisible();
    await row.getByTestId("product-delete").click();

    await expect(adminPage.getByTestId("delete-dialog")).toBeVisible();
    await adminPage.getByTestId("delete-confirm").click();

    await expect(adminPage.locator(".Toastify__toast--error")).toBeVisible();
    await expect(products.rowByProductId(2)).toBeVisible();

    await adminPage.getByTestId("delete-cancel").click();
  });

  test("searches products in admin table", async ({ adminPage }) => {
    const products = new AdminProductsPage(adminPage);
    await products.goto();
    await expect(products.rows.first()).toBeVisible();

    await products.search.fill("Samsung");
    await expect(products.rowByProductId(2)).toBeVisible();
  });
});

test.describe("Admin product API guard", () => {
  test("denies POST when user role calls directly (403)", async ({ userPage }) => {
    const res = await userPage.request.post("/api/admin/products", {
      data: { name: "E2E-hack", description: "", price: 10, categoryId: 1 },
    });
    expect(res.status()).toBe(403);
  });

  test("denies POST when anonymous calls directly (401)", async ({ browser }) => {
    const context = await browser.newContext();
    const res = await context.request.post("http://localhost:3030/api/admin/products", {
      data: { name: "E2E-hack", description: "", price: 10, categoryId: 1 },
    });
    await context.close();
    expect(res.status()).toBe(401);
  });
});
