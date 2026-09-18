import { test, expect, type Page } from "@playwright/test";
import { E2E_USERS } from "./helpers/test-users";
import { LoginPage } from "./pages/login.page";

/**
 * TEST_1.4 Cart + Checkout (P0, Risk 12)
 * ตะกร้าเก็บใน localStorage key `skill-cart` (zustand persist)
 *
 * Known limitation: ปุ่มยืนยันการสั่งซื้อทำแค่ clearCart()+replace('/product')
 * ไม่ได้สร้าง order ใน DB — เคส K6 assert ตามพฤติกรรมจริงที่เป็นอยู่
 */
const CART_KEY = "skill-cart";

async function clearCart(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate((key) => localStorage.removeItem(key), CART_KEY);
  await page.reload();
}

async function addFirstProductToCart(page: Page): Promise<string> {
  await page.goto("/product");
  const card = page.getByTestId("product-card").first();
  const name = ((await card.getByTestId("product-name").innerText()) ?? "").trim();
  await card.getByTestId("add-to-cart").click();
  await expect(page.getByTestId("cart-count")).toHaveText("1");
  return name;
}

test.describe("Cart", () => {
  test.beforeEach(async ({ page }) => {
    await clearCart(page);
  });

  test("adds product and updates badge when add clicked", async ({ page }) => {
    const name = await addFirstProductToCart(page);
    expect(name.length).toBeGreaterThan(0);

    const stored = await page.evaluate((key) => localStorage.getItem(key), CART_KEY);
    expect(stored).toContain("productId");
  });

  test("persists cart after reload", async ({ page }) => {
    const name = await addFirstProductToCart(page);

    await page.reload();
    await page.goto("/cart");

    await expect(page.getByTestId("cart-list")).toBeVisible();
    await expect(page.getByTestId("cart-item-name").first()).toContainText(
      name.replace(/^Name:\s*/i, "").split(/\s+/)[0]!,
    );
  });

  test("shows correct total for one item", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.goto("/cart");

    const qty = (await page.getByTestId("cart-item-qty").first().innerText()).trim();
    const itemTotal = (await page.getByTestId("cart-item-total").first().innerText()).trim();
    const cartTotal = (await page.getByTestId("cart-total").innerText()).trim();

    expect(qty).toBe("1");
    expect(cartTotal).toContain(itemTotal);
  });

  test("removes row when delete clicked", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.goto("/cart");

    await page.getByTestId("cart-remove-item").first().click();

    await expect(page.getByTestId("cart-empty")).toBeVisible();
    await expect(page.getByTestId("cart-row")).toHaveCount(0);
  });

  test("clears all when clear-all clicked", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.goto("/cart");

    await page.getByTestId("cart-clear").click();

    await expect(page.getByTestId("cart-empty")).toBeVisible();
  });

  test("clears cart and redirects to /product when checkout with items", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.goto("/cart");
    await expect(page.getByTestId("cart-list")).toBeVisible();

    await page.getByTestId("cart-checkout").click();

    await expect(page).toHaveURL(/\/product/);

    await page.goto("/cart");
    await expect(page.getByTestId("cart-empty")).toBeVisible();
  });

  test("hides checkout button when cart empty", async ({ page }) => {
    await page.goto("/cart");

    await expect(page.getByTestId("cart-empty")).toBeVisible();
    await expect(page.getByTestId("cart-checkout")).toBeHidden();
  });

  test("keeps cart for logged-in user after reload", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(E2E_USERS.user.email, E2E_USERS.user.password);
    await expect(login.userName).toBeVisible();

    await addFirstProductToCart(page);
    await page.reload();

    await page.goto("/cart");
    await expect(page.getByTestId("cart-list")).toBeVisible();
  });
});
