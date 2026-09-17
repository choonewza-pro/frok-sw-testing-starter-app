# Page Object Model (POM) Design Pattern

## 1. What is the Page Object Model?

The **Page Object Model (POM)** is an industry-standard test automation design pattern. It creates an abstraction layer between the actual web page DOM and the test specifications.

```
┌─────────────────────────────────────────────────────────┐
│               Test Specifications (*.spec.ts)           │
│   - Expresses user journeys & business rules            │
│   - Contains assertions: expect(page).toHaveURL(...)    │
└────────────────────────────┬────────────────────────────┘
                             │ calls methods on
┌────────────────────────────▼────────────────────────────┐
│               Page Objects (*.page.ts)                  │
│   - Encapsulates Locators & Elements                    │
│   - Exposes Action Methods: login(), searchProduct()    │
│   - No raw assertions inside action methods             │
└────────────────────────────┬────────────────────────────┘
                             │ interacts with
┌────────────────────────────▼────────────────────────────┐
│                    Web Application UI                   │
└─────────────────────────────────────────────────────────┘
```

### Benefits of POM

- **Single Source of Truth:** If the UI design changes (e.g. login button text changes from "Log in" to "Sign in"), you update **one line** in the Page Object class, and all 50 test cases immediately pass.
- **High Readability:** Test code reads like clean user stories rather than messy DOM queries.
- **Reusable Components:** Shared UI widgets (Navbar, Cart Drawer, Modal Dialog) can be extracted into reusable Component Objects.

---

## 2. Implementing Page Objects in TypeScript

### Example 1: `LoginPage` Class (`e2e/pages/login.page.ts`)

```typescript
import { type Page, type Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email address');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Sign in' });
    this.errorMessage = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, pass: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(pass);
    await this.submitButton.click();
  }
}
```

### Example 2: Component Object (`e2e/components/navbar.component.ts`)

```typescript
import { type Page, type Locator } from '@playwright/test';

export class NavbarComponent {
  readonly page: Page;
  readonly cartBadge: Locator;
  readonly userMenuButton: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartBadge = page.getByTestId('nav-cart-count');
    this.userMenuButton = page.getByRole('button', { name: 'User profile menu' });
    this.searchInput = page.getByPlaceholder('Search catalog...');
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
  }
}
```

---

## 3. Writing Tests Using Page Objects

Notice how clean, declarative, and maintainable the test spec becomes:

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';

test.describe('Authentication Journeys', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('redirects to dashboard when credentials are valid', async ({ page }) => {
    await loginPage.login('alice@example.com', 'ValidPassword123!');

    // Assertions remain in test file (not hidden inside POM method)
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByRole('heading', { name: 'Welcome, Alice' })).toBeVisible();
  });

  test('shows error alert when password is invalid', async () => {
    await loginPage.login('alice@example.com', 'WrongPass!');

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText('Invalid email or password');
  });
});
```

---

## 4. Best Practices & Rules for POM

1. **Keep Assertions in Test Files:** Do not embed `expect(...)` inside Page Object action methods unless it verifies an internal page transition. Test assertions belong in the test spec for clear reporting.
2. **Use Readonly Locators:** Declare locators in the constructor as `readonly Locator`. Locators are evaluated lazily upon action, so creating them in the constructor does not incur any network or DOM cost.
3. **Return New Page Objects on Navigation:** If an action navigates to another page, you may return the next Page Object instance:
   ```typescript
   async submitValidOrder(): Promise<ConfirmationPage> {
     await this.submitButton.click();
     return new ConfirmationPage(this.page);
   }
   ```
4. **Group Common Navigation in Fixtures:** Combine POMs with custom Playwright fixtures to automatically inject initialized page objects into tests.
