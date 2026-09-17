# Test Hierarchy, Naming Conventions, and Lifecycle Hooks

## 1. Test Hierarchy in Playwright

Playwright structures tests in a clear, nested hierarchy. Understanding this structure helps organize test suites, apply shared configurations, and interpret test reports:

```
Root Suite (Entire test run across all projects)
 └── Project Suite (e.g., Chromium, Firefox, WebKit, Mobile Safari)
      └── File Suite (e.g., login.spec.ts, checkout.spec.ts)
           └── Test Suite (Created with test.describe())
                └── Test Case (Created with test())
                     └── Test Actions (page.goto, click, fill, expect)
```

| Hierarchy Level | Representation | Purpose & Scope |
| :--- | :--- | :--- |
| **Root Suite** | Execution session | Top-level container representing the complete test run. |
| **Project Suite** | `projects` in config | Browser/device configuration group (e.g. `Desktop Chrome`, `Mobile Safari`). |
| **File Suite** | `.spec.ts` file | Physical test file grouping scenarios for a specific feature domain. |
| **Test Suite** | `test.describe('name', () => {})` | Logical group of related test cases sharing setup/teardown hooks. |
| **Test Case** | `test('name', async ({ page }) => {})` | A single atomic test scenario that runs in an isolated `BrowserContext`. |
| **Test Action** | Statement inside test case | Individual action or assertion tracked in Trace Viewer and reporters. |

---

## 2. Test Naming Best Practices

A well-named test acts as **Living Documentation**. Anyone reading a CI test failure report should instantly understand what broke and under what condition without digging into the code.

> **Recommended Standard Formula:**
> `[expected behavior] when [scenario or condition]`

### Examples: Good vs Bad Names

| ❌ Bad / Vague Name | ✅ Good Standard Name (`[behavior] when [condition]`) |
| :--- | :--- |
| `test('login')` | `test('redirects to dashboard when login succeeds')` |
| `test('error test')` | `test('shows error message when password is incorrect')` |
| `test('form submit')` | `test('shows validation message when email is empty')` |
| `test('user test')` | `test('creates a new user when valid data is submitted')` |
| `test('profile')` | `test('updates user profile when changes are saved')` |
| `test('delete')` | `test('deletes a user when deletion is confirmed')` |
| `test('cart test')` | `test('adds product to cart when add to cart button is clicked')` |
| `test('checkout')` | `test('prevents checkout when cart is empty')` |
| `test('success case')` | `test('shows order confirmation after successful checkout')` |
| `test('protected route')` | `test('redirects guest users to login page when accessing protected route')` |

### The "One Behavior Per Test" Rule

Do NOT combine multiple user stories into a single broad test:

```typescript
// ❌ Bad: Too broad, difficult to identify which step failed in CI
test('user management works correctly', async ({ page }) => {
  // creates user...
  // updates profile...
  // changes password...
  // deletes user...
});

// ✅ Good: Split into focused, isolated test cases
test.describe('User Management', () => {
  test('creates a new user when valid form data is submitted', async ({ page }) => { ... });
  test('updates user profile when valid edits are saved', async ({ page }) => { ... });
  test('deletes user record when deletion is confirmed in dialog', async ({ page }) => { ... });
});
```

---

## 3. Lifecycle Hooks

Use lifecycle hooks inside `test.describe()` to eliminate repetitive code while keeping tests readable and DRY:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Shopping Cart Navigation', () => {
  // Runs once before all tests in this worker process
  test.beforeAll(async () => {
    // Seed test-level fixtures if needed
  });

  // Runs before EVERY individual test case
  test.beforeEach(async ({ page }) => {
    // Navigate to baseline page so individual tests don't repeat page.goto()
    await page.goto('/store/products');
  });

  // Runs after EVERY individual test case
  test.afterEach(async ({ page }) => {
    // Clean up temporary cookies or test artifacts if needed
  });

  // Runs once after all tests in this worker process complete
  test.afterAll(async () => {
    // Teardown connections
  });

  test('filters catalog when electronics category is selected', async ({ page }) => {
    await page.getByRole('button', { name: 'Electronics' }).click();
    await expect(page.getByRole('heading', { name: 'Electronics Catalog' })).toBeVisible();
  });
});
```

---

## 4. Test Annotations

Playwright provides built-in annotations to handle test execution states conditionally:

```typescript
// 1. Skip test conditionally or unconditionally
test('mobile drawer opens', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile drawer is only available on mobile viewports');
  // test steps...
});

// 2. Mark known bug being tracked
test('renders international tax calculation', async ({ page }) => {
  test.fixme(true, 'JIRA-1049: Tax service rounding error on decimal currencies');
  // test steps...
});

// 3. Mark slow tests to multiply test timeout (e.g. 3x normal timeout)
test('generates large monthly PDF report', async ({ page }) => {
  test.slow();
  // slow operations...
});

// 4. Expect test to fail (e.g. bug reproduction)
test('handles malformed JWT token gracefully', async ({ page }) => {
  test.fail();
  // test steps...
});
```
