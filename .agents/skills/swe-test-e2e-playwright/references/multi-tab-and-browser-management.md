# Multi-Tab and Browser Management

## 1. Browser, Context, and Pages Relationship

In Playwright, tabs and windows are represented as `Page` objects that belong to a parent `BrowserContext`:

```
Browser
 └── BrowserContext
      ├── Page 1 (Main tab)
      └── Page 2 (Popup tab / External OAuth)
```

Because all pages inside the same `BrowserContext` share the same session, cookies, and local storage, you can test multi-tab workflows seamlessly.

---

## 2. Handling New Tabs and Popups

When a user clicks a button or link with `target="_blank"`, a new tab opens. Because opening a tab is asynchronous, you must register the `waitForEvent('page')` listener **concurrently** with the triggering action to avoid race conditions.

### Pattern: Handling Popups with `Promise.all`

```typescript
import { test, expect } from '@playwright/test';

test('opens terms of service in a new tab when clicked', async ({ context, page }) => {
  await page.goto('/signup');

  // Start waiting for new page BEFORE or SIMULTANEOUSLY with clicking
  const [newPage] = await Promise.all([
    context.waitForEvent('page'),
    page.getByRole('link', { name: 'Terms of Service' }).click(),
  ]);

  // Wait for new page DOM to load
  await newPage.waitForLoadState('domcontentloaded');

  // Assert on the new tab
  await expect(newPage).toHaveURL(/.*terms-of-service/);
  await expect(newPage.getByRole('heading', { name: 'Terms of Service' })).toBeVisible();

  // Close the new tab and return to the primary page
  await newPage.close();
  await expect(page.getByLabel('Email address')).toBeVisible();
});
```

---

## 3. Creating New Pages Manually

If you need to test multi-user real-time interaction (e.g. Chat app, collaborative editor, or two users bidding on an item):

```typescript
test('supports real-time chat between two users in different contexts', async ({ browser }) => {
  // Context 1: Alice
  const aliceContext = await browser.newContext();
  const alicePage = await aliceContext.newPage();
  await alicePage.goto('/chat');
  await alicePage.getByLabel('Your Name').fill('Alice');
  await alicePage.getByRole('button', { name: 'Join' }).click();

  // Context 2: Bob (completely isolated cookies/session!)
  const bobContext = await browser.newContext();
  const bobPage = await bobContext.newPage();
  await bobPage.goto('/chat');
  await bobPage.getByLabel('Your Name').fill('Bob');
  await bobPage.getByRole('button', { name: 'Join' }).click();

  // Alice sends a message
  await alicePage.getByPlaceholder('Type a message...').fill('Hello Bob!');
  await alicePage.keyboard.press('Enter');

  // Bob receives it in real-time
  await expect(bobPage.getByText('Alice: Hello Bob!')).toBeVisible();

  // Teardown
  await aliceContext.close();
  await bobContext.close();
});
```

---

## 4. Handling Browser Dialogs (Alert, Confirm, Prompt)

Playwright automatically dismisses browser dialogs (e.g. `window.alert`, `window.confirm`) by default so tests do not hang. To handle or accept dialogs explicitly:

```typescript
test('accepts deletion confirmation alert', async ({ page }) => {
  await page.goto('/settings');

  // Listen for the dialog event before clicking delete
  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toBe('Are you sure you want to delete this workspace?');
    await dialog.accept(); // or dialog.dismiss()
  });

  await page.getByRole('button', { name: 'Delete Workspace' }).click();
  await expect(page.getByText('Workspace deleted')).toBeVisible();
});
```

---

## 5. Browser Options & Emulation

You can configure viewport size, geolocation, locale, and slowdown options either globally in `playwright.config.ts` or per test case:

```typescript
test('renders currency in Thai Baht when locale is set to th-TH', async ({ browser }) => {
  const context = await browser.newContext({
    locale: 'th-TH',
    timezoneId: 'Asia/Bangkok',
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  await page.goto('/pricing');
  await expect(page.getByText('฿990 / เดือน')).toBeVisible();

  await context.close();
});
```
