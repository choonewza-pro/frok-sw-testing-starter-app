# Complete End-to-End Test Examples

This reference provides production-ready, fully-typed TypeScript examples demonstrating best practices in Playwright.

---

## Example 1: Full E-Commerce User Journey

Simulating the end-to-end user journey: Browse catalog → Filter product → Add to cart → Proceed to checkout → Confirm purchase.

```typescript
// e2e/ecommerce-checkout.spec.ts
import { test, expect } from '@playwright/test';

test.describe('E-Commerce Purchasing Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/store');
  });

  test('completes purchase order when valid payment details are provided', async ({ page }) => {
    // 1. Browse & Filter catalog
    await page.getByRole('button', { name: 'Electronics' }).click();
    const productCard = page.getByRole('article').filter({ hasText: 'Mechanical Keyboard RGB' });
    await expect(productCard).toBeVisible();

    // 2. Add product to shopping cart
    await productCard.getByRole('button', { name: 'Add to Cart' }).click();

    // 3. Open cart drawer and verify summary
    const cartDrawer = page.getByRole('dialog', { name: 'Shopping Cart' });
    await expect(cartDrawer).toBeVisible();
    await expect(cartDrawer.getByText('Mechanical Keyboard RGB')).toBeVisible();
    await expect(cartDrawer.getByTestId('cart-item-count')).toHaveText('1');

    // 4. Proceed to Checkout
    await cartDrawer.getByRole('button', { name: 'Proceed to Checkout' }).click();
    await expect(page).toHaveURL(/.*checkout/);

    // 5. Fill Shipping Information
    await page.getByLabel('Full Name').fill('Alice Somchai');
    await page.getByLabel('Shipping Address').fill('123 Sukhumvit Road, Bangkok');
    await page.getByLabel('Postal Code').fill('10110');
    await page.getByLabel('Country').selectOption('TH');

    // 6. Complete Order
    await page.getByRole('button', { name: 'Place Order' }).click();

    // 7. Verify Success Confirmation (Web-First Assertions)
    await expect(page).toHaveURL(/.*order-success/);
    await expect(page.getByRole('heading', { name: 'Thank you for your order!' })).toBeVisible();
    await expect(page.getByTestId('order-confirmation-number')).toContainText('ORD-');
  });

  test('prevents checkout when shopping cart is empty', async ({ page }) => {
    await page.goto('/checkout');

    // System should redirect away from checkout when empty
    await expect(page).toHaveURL(/.*store/);
    await expect(page.getByRole('alert')).toContainText('Your cart is empty');
  });
});
```

---

## Example 2: Page Object Model (POM) Implementation

Refactoring complex page interactions into reusable classes.

### The Page Object (`e2e/pages/inventory.page.ts`)

```typescript
import { type Page, type Locator } from '@playwright/test';

export class InventoryPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly categoryDropdown: Locator;
  readonly productList: Locator;
  readonly cartBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByPlaceholder('Search products...');
    this.categoryDropdown = page.getByLabel('Filter by Category');
    this.productList = page.getByRole('list', { name: 'Products catalog' });
    this.cartBadge = page.getByTestId('cart-count-badge');
  }

  async goto() {
    await this.page.goto('/inventory');
  }

  async searchProduct(name: string) {
    await this.searchInput.fill(name);
    await this.searchInput.press('Enter');
  }

  async addProductToCart(productName: string) {
    const item = this.productList.getByRole('listitem').filter({ hasText: productName });
    await item.getByRole('button', { name: 'Add to Cart' }).click();
  }
}
```

### The Test Specification (`e2e/inventory.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';
import { InventoryPage } from './pages/inventory.page';

test.describe('Inventory Catalog', () => {
  let inventoryPage: InventoryPage;

  test.beforeEach(async ({ page }) => {
    inventoryPage = new InventoryPage(page);
    await inventoryPage.goto();
  });

  test('updates cart counter when item is added from catalog', async ({ page }) => {
    await inventoryPage.searchProduct('Noise Cancelling Headphones');
    await inventoryPage.addProductToCart('Noise Cancelling Headphones');

    await expect(inventoryPage.cartBadge).toHaveText('1');
  });
});
```

---

## Example 3: Multi-Tab External OAuth / Payment Popup

Handling third-party authentication or payment popup windows safely without race conditions.

```typescript
import { test, expect } from '@playwright/test';

test('completes external OAuth sign-in flow via popup window', async ({ context, page }) => {
  await page.goto('/login');

  // Register the popup listener BEFORE clicking the trigger button
  const [popup] = await Promise.all([
    context.waitForEvent('page'),
    page.getByRole('button', { name: 'Continue with Google' }).click(),
  ]);

  // Wait for the popup page to load
  await popup.waitForLoadState('domcontentloaded');
  await expect(popup).toHaveURL(/accounts\.google\.com/);

  // Perform actions inside the popup window
  await popup.getByLabel('Email or phone').fill('alice.tester@gmail.com');
  await popup.getByRole('button', { name: 'Next' }).click();

  // (Simulated OAuth callback redirect closes the popup)
  // Back on the main page, verify logged in state
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.getByRole('heading', { name: 'Welcome, Alice' })).toBeVisible();
});
```

---

## Example 4: Third-Party Network Mocking with `page.route`

Intercepting an external SMS OTP verification service so the E2E test runs deterministically in CI without consuming real SMS credits.

```typescript
import { test, expect } from '@playwright/test';

test('activates two-factor authentication when OTP code is verified', async ({ page }) => {
  // Mock external SMS verification API
  await page.route('**/api/v1/sms/verify-otp', async (route) => {
    const request = route.request();
    const postData = request.postDataJSON();

    if (postData.code === '123456') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ verified: true, token: 'mock-auth-jwt' }),
      });
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid verification code' }),
      });
    }
  });

  await page.goto('/settings/security');
  await page.getByRole('button', { name: 'Enable 2FA' }).click();

  // Fill the mocked valid OTP
  await page.getByLabel('Enter 6-digit Code').fill('123456');
  await page.getByRole('button', { name: 'Verify' }).click();

  // Assert success feedback
  await expect(page.getByRole('alert')).toContainText('Two-factor authentication enabled');
});
```
