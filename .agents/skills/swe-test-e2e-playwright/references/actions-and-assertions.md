# Actions, Web-First Assertions, and Network Mocking

## 1. Playwright Actions and Auto-Waiting

Every action in Playwright represents a real user interaction on the page. Before executing any action, Playwright performs **Actionability Checks** automatically:

```
Locator Action Triggered (e.g. click)
 ├── Attached?      (Element is in DOM)
 ├── Visible?       (Not display:none, not opacity:0)
 ├── Stable?        (CSS animation finished, not moving)
 ├── Receives Event? (Not obstructed by loading overlays)
 └── Enabled?       (Not disabled)
      └── Execute Action!
```

If these checks are not satisfied immediately, Playwright **polls and retries** continuously until the action timeout (default: 30s) expires. **Never insert `page.waitForTimeout(3000)` before actions.**

### Common Actions Reference

```typescript
// 1. Click
await page.getByRole('button', { name: 'Save' }).click();
await page.getByRole('button', { name: 'Delete' }).dblclick();

// 2. Text Input
await page.getByLabel('Username').fill('john_doe'); // Clears and types fast
await page.getByLabel('Search').pressSequentially('query', { delay: 100 }); // Types with keystroke delay

// 3. Checkbox & Radio
await page.getByRole('checkbox', { name: 'Accept Terms' }).check();
await page.getByRole('checkbox', { name: 'Accept Terms' }).uncheck();

// 4. Dropdowns / Select
await page.getByLabel('Country').selectOption('TH'); // By value
await page.getByLabel('Country').selectOption({ label: 'Thailand' }); // By label

// 5. Keyboard & Shortcuts
await page.keyboard.press('Enter');
await page.getByLabel('Search').press('Control+A');

// 6. Hover
await page.getByRole('button', { name: 'Menu' }).hover();

// 7. File Upload
await page.getByLabel('Upload Avatar').setInputFiles('tests/fixtures/avatar.png');
// Multiple files:
await page.getByLabel('Upload Documents').setInputFiles([
  'tests/fixtures/doc1.pdf',
  'tests/fixtures/doc2.pdf'
]);
```

---

## 2. Web-First Assertions (Auto-Retrying)

Unlike standard test assertions in Jest or Vitest (`expect(value).toBe(...)`), Playwright provides **Web-First Assertions**. They wait asynchronously and poll the browser until the expected state is reached:

```typescript
// ✅ Web-first assertion (auto-retries up to expect.timeout, default 5s):
await expect(page.getByRole('alert')).toBeVisible();

// ❌ Anti-pattern (synchronous check, does not retry, causes flaky failures):
const isVisible = await page.getByRole('alert').isVisible();
expect(isVisible).toBe(true);
```

### Complete Web-First Assertions Table

| Assertion | Description | Example |
| :--- | :--- | :--- |
| `toBeVisible()` | Element is visible on the page | `await expect(page.getByRole('dialog')).toBeVisible();` |
| `toBeHidden()` | Element is hidden or removed from DOM | `await expect(page.getByText('Loading...')).toBeHidden();` |
| `toHaveText(expected)` | Exact text content matches string or regex | `await expect(page.getByTestId('badge')).toHaveText('Active');` |
| `toContainText(expected)` | Element contains the given substring | `await expect(page.getByTestId('order-msg')).toContainText('Order #1049');` |
| `toHaveValue(expected)` | Form input value matches | `await expect(page.getByLabel('Email')).toHaveValue('user@test.com');` |
| `toHaveURL(expected)` | Page URL matches string or regex pattern | `await expect(page).toHaveURL(/.*dashboard/);` |
| `toHaveTitle(expected)` | Page document title matches | `await expect(page).toHaveTitle(/Online Store/);` |
| `toBeChecked()` | Checkbox or radio button is selected | `await expect(page.getByRole('checkbox')).toBeChecked();` |
| `toBeEnabled()` | Element is interactive / not disabled | `await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled();` |
| `toBeDisabled()` | Element has `disabled` attribute | `await expect(page.getByRole('button', { name: 'Submit' })).toBeDisabled();` |
| `toHaveCount(expected)` | Locator matches exact number of elements | `await expect(page.getByRole('listitem')).toHaveCount(4);` |

### Soft Assertions (`expect.soft`)

When you want to verify multiple independent checks without terminating the test on the first failure:

```typescript
// Soft assertions log failures but allow the test to proceed
await expect.soft(page.getByTestId('first-name')).toHaveText('John');
await expect.soft(page.getByTestId('last-name')).toHaveText('Doe');
await expect.soft(page.getByTestId('email')).toHaveText('john.doe@example.com');
```

---

## 3. Network Mocking with `page.route()`

In E2E testing, the core system (Frontend + Backend + DB) should run unmocked. However, **third-party external boundaries** (e.g. Stripe payments, SMS OTP services, external webhook APIs) should be intercepted with `page.route()` to avoid flakiness and cost.

### Mocking Third-Party External APIs

```typescript
test('displays paid confirmation when payment gateway webhook succeeds', async ({ page }) => {
  // Intercept call to third-party payment provider
  await page.route('**/api/v1/payments/stripe/charge', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'ch_mock_12345',
        status: 'succeeded',
        amount: 2500,
      }),
    });
  });

  await page.goto('/checkout');
  await page.getByRole('button', { name: 'Pay with Card' }).click();

  await expect(page.getByRole('heading', { name: 'Payment Successful' })).toBeVisible();
});
```

### Simulating API Errors & Fallback UI

```typescript
test('shows error notification when external inventory service is down', async ({ page }) => {
  // Force HTTP 500 error from external service
  await page.route('**/api/inventory/check', async (route) => {
    await route.fulfill({
      status: 500,
      body: 'Internal Server Error',
    });
  });

  await page.goto('/products/keyboard');
  await expect(page.getByText('Unable to verify stock at this moment')).toBeVisible();
});
```
