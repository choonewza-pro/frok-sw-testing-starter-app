# Authentication State Sharing and Custom Fixtures

## 1. Why Sharing Authentication State Matters

In a realistic test suite of 50–100 E2E tests, navigating to the login page, filling credentials, waiting for 2FA/redirects, and establishing a session in **every single test case** can add 15–20 minutes to CI runtimes.

Playwright solves this by allowing tests to **authenticate once**, save the browser's storage state (cookies, session tokens, localStorage) to a JSON file, and then seed that state into subsequent tests in **< 10ms**.

```
┌────────────────────────────────────────────────────────┐
│  Setup Project (Runs Once before all tests)            │
│  - Launches browser, fills login form, verifies auth   │
│  - Saves cookies & localStorage to:                    │
│    playwright/.auth/user.json                          │
└──────────────────────────┬─────────────────────────────┘
                           │ reuses storageState
        ┌──────────────────┴──────────────────┐
        ▼                                     ▼
┌───────────────────────────────┐ ┌───────────────────────────────┐
│ Worker 1: Test "View Orders"  │ │ Worker 2: Test "Edit Profile" │
│ - Starts pre-authenticated    │ │ - Starts pre-authenticated    │
│ - Zero UI login overhead!     │ │ - Zero UI login overhead!     │
└───────────────────────────────┘ └───────────────────────────────┘
```

---

## 2. Implementing `storageState` with Project Dependencies

### Step 1: Create the Auth Setup Spec (`e2e/auth.setup.ts`)

```typescript
import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate user and save storage state', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(process.env.E2E_USER_EMAIL || 'testuser@example.com');
  await page.getByLabel('Password').fill(process.env.E2E_USER_PASSWORD || 'Password123!');
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Wait until the session is fully committed (e.g. redirected to dashboard)
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();

  // Save authenticated cookies and localStorage to disk
  await page.context().storageState({ path: authFile });
});
```

### Step 2: Configure Project Dependency in `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    // 1. Setup project runs first
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // 2. Main tests depend on setup and use the saved storageState
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    // 3. Unauthenticated / Guest tests can override storageState
    {
      name: 'guest',
      use: {
        ...devices['Desktop Chrome'],
        storageState: { cookies: [], origins: [] }, // Cleared storage
      },
    },
  ],
});
```

---

## 3. Creating Custom Fixtures with `test.extend`

Playwright's Fixture system allows dependency injection of pre-configured pages, services, or page objects directly into test functions.

### Example: Custom Fixture Providing Initialized POMs

```typescript
// e2e/fixtures/test.fixture.ts
import { test as base, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';

type CustomFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
};

export const test = base.extend<CustomFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },
});

export { expect } from '@playwright/test';
```

### Using the Custom Fixture in Tests

```typescript
import { test, expect } from './fixtures/test.fixture';

test('navigates to settings from dashboard', async ({ dashboardPage, page }) => {
  await dashboardPage.goto();
  await dashboardPage.openSettings();
  await expect(page).toHaveURL(/.*settings/);
});
```

---

## 4. Test Data Isolation & Idempotency in Parallel Runs

When Playwright runs with multiple workers in parallel (e.g. 4 workers), tests creating accounts or orders can collide if they use static dummy data like `user@example.com`.

### Rules for Safe Parallel Data

1. **Generate Unique Identifiers:** Append timestamps or random hashes to mutable fields:
   ```typescript
   function createUniqueEmail(): string {
     return `e2e-user-${Date.now()}-${Math.floor(Math.random() * 10000)}@test.com`;
   }
   ```
2. **Never Rely on Auto-Increment Sequence IDs:** Assert on unique business identifiers (e.g. order numbers generated during the flow) rather than assuming `id === 1`.
3. **Isolate Test Tenancy:** When testing multi-tenant apps, generate a fresh workspace or organization per test suite, or clean up records via teardown APIs in `test.afterAll`.
