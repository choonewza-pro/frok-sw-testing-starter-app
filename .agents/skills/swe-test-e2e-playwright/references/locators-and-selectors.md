# Locators and Selectors in Playwright

## 1. What are Locators and Why Do They Matter?

In Playwright, a **Locator** is not a static DOM element snapshot; it is a live query description. Playwright re-evaluates the locator dynamically at the exact millisecond an action is performed, applying **auto-waiting** and **auto-retry** until the element becomes actionable.

> **The Golden Principle of Locators:**
> **"เลือก Locator แบบเดียวกับที่ผู้ใช้จริงมองหา Element"**
> Find elements the same way real users do: by accessible role, button text, or form label — NOT by CSS class names, IDs, or XPath DOM paths.

| Quality | Good Locator | Bad / Brittle Locator |
| :--- | :--- | :--- |
| **Resilience** | Remains stable when Tailwind/CSS classes or HTML tags change | Breaks immediately when a developer refactors styles or layout |
| **Readability** | Reads like business logic: `getByRole('button', { name: 'Checkout' })` | Cryptic CSS: `div.css-1a2b3c > button:nth-child(2)` |
| **Accessibility** | Enforces accessible HTML (ARIA roles, proper `<label>`) | Ignores accessibility standards completely |

---

## 2. Priority Hierarchy for Locators

Always choose locators from top to bottom of this priority list:

```
Priority 1: getByRole()           ──► Best: Accessible role & accessible name
Priority 2: getByLabel()          ──► Form inputs with associated <label>
Priority 3: getByPlaceholder()    ──► Form inputs without visible labels
Priority 4: getByText()           ──► Non-interactive visible text
Priority 5: getByTestId()         ──► Explicit data-testid (when no role fits)
Priority 6: locator() (CSS)       ──► Fallback when no semantic locator fits
Priority 7: XPath                 ──► Last resort (Avoid in modern codebases)
```

### Detailed Method Reference

#### 1. `page.getByRole(role, options)` (Priority 1 - Recommended)
Finds elements using ARIA accessibility roles and accessible names.
```typescript
// Buttons
await page.getByRole('button', { name: 'Sign in' }).click();

// Headings
await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

// Links
await page.getByRole('link', { name: 'Pricing' }).click();

// Dialogs & Modals
const modal = page.getByRole('dialog', { name: 'Confirm Delete' });

// Checkboxes
await page.getByRole('checkbox', { name: 'Subscribe to newsletter' }).check();
```

#### 2. `page.getByLabel(text, options)` (Priority 2 - Forms)
Locates form inputs by their associated `<label>` text.
```typescript
await page.getByLabel('Email address').fill('user@example.com');
await page.getByLabel('Password').fill('SecretPassword123!');
```

#### 3. `page.getByPlaceholder(text, options)` (Priority 3)
Locates an input field by its placeholder attribute when an explicit label is absent.
```typescript
await page.getByPlaceholder('Search products, brands and categories').fill('mechanical keyboard');
```

#### 4. `page.getByText(text, options)` (Priority 4)
Locates elements by their visible text content.
```typescript
// Substring or exact match
await expect(page.getByText('Order completed successfully')).toBeVisible();

// Exact match option
await page.getByText('Log in', { exact: true }).click();
```

#### 5. `page.getByTestId(testId)` (Priority 5)
Locates an element by its `data-testid` attribute. Recommended for dynamic, complex, or third-party components that lack semantic roles.
```typescript
// Configurable in playwright.config.ts (defaults to data-testid)
await page.getByTestId('cart-summary-total').click();
```

#### 6. `page.locator(selector)` (Priority 6 - CSS Fallback)
Use CSS selectors only when semantic locators cannot target the element.
```typescript
// Target specific layout structures
await page.locator('article.product-card').first().click();
```

#### 7. XPath (Priority 7 - Anti-pattern)
Do not use XPath in modern tests. It couples tests directly to deep DOM hierarchies that break during normal UI refactoring.
```typescript
// ❌ Fragile DOM path - AVOID:
page.locator('xpath=//div[3]/table/tbody/tr[2]/td[4]/button');
```

---

## 3. Chaining and Filtering Locators

In complex UIs (such as cards, tables, or item lists), multiple items often share identical button labels. Narrow the scope using `.filter()` and locator chaining.

### Using `.filter({ hasText })` and `.filter({ has })`

```typescript
// Locate the specific listitem that contains "Product 2", then click its button
await page
  .getByRole('listitem')
  .filter({ hasText: 'Mechanical Keyboard' })
  .getByRole('button', { name: 'Add to cart' })
  .click();
```

### Table Row Filtering Example

```typescript
// Locate table row containing user email and click its delete action
const targetRow = page.getByRole('row').filter({ hasText: 'alice@example.com' });
await targetRow.getByRole('button', { name: 'Delete user' }).click();
```

---

## 4. Good vs. Bad Locator Comparison

| Scenario | ❌ Bad (Brittle) | ✅ Good (Resilient) |
| :--- | :--- | :--- |
| **Submit Button** | `page.locator('button.btn.btn-primary.submit-btn-v2')` | `page.getByRole('button', { name: 'Submit' })` |
| **Email Input** | `page.locator('#email-input')` | `page.getByLabel('Email address')` |
| **Item in List** | `page.locator('.todo-list > li:nth-child(3) .destroy')` | `page.getByRole('listitem').filter({ hasText: 'Buy milk' }).getByRole('button', { name: 'Delete' })` |
| **Modal Header** | `page.locator('.modal-header h4')` | `page.getByRole('dialog').getByRole('heading', { name: 'Account Settings' })` |

---

## 5. Discovering Locators with Codegen

Playwright provides a built-in interactive tool that records browser actions and suggests resilient, role-based locators automatically:

```bash
# Launch codegen on target URL:
npx playwright codegen http://localhost:3000

# Emulate mobile device:
npx playwright codegen --device="iPhone 13" http://localhost:3000
```
Use Codegen to explore pages and inspect locator recommendations directly in the inspector window.
