# Configuration (`playwright.config.ts`) and CLI Commands

## 1. Full Production `playwright.config.ts` Template

Playwright controls all test behavior, browser definitions, timeouts, reporters, and local servers through `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Directory where test spec files are located
  testDir: './e2e',

  // Maximum time one test can run for (default: 30s)
  timeout: 30 * 1000,

  // Timeout for each individual expect() assertion (default: 5s)
  expect: {
    timeout: 5 * 1000,
  },

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only to absorb transient network blips
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI if system resources are constrained
  workers: process.env.CI ? 2 : undefined,

  // Reporter to use
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  // Shared settings for all projects
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Capture screenshot only on failure
    screenshot: 'only-on-failure',

    // Record video only on retry
    video: 'on-first-retry',

    // Timeout for each individual action (e.g. click, fill)
    actionTimeout: 10 * 1000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile Viewport Emulation
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

---

## 2. Playwright Timeouts Matrix

Playwright provides granular timeout controls at multiple execution levels:

| Timeout Level | Config Key | Default | Purpose |
| :--- | :--- | :--- | :--- |
| **Test Timeout** | `timeout` | `30,000 ms` | Maximum duration for an entire test case (including hooks). |
| **Expect Timeout** | `expect.timeout` | `5,000 ms` | Maximum time a Web-First assertion retries before failing. |
| **Action Timeout** | `use.actionTimeout` | `0` (disabled) | Maximum time an action (e.g. `click()`) waits for actionability. |
| **Navigation Timeout**| `use.navigationTimeout`| `0` (disabled) | Maximum time `page.goto()` waits for page load state. |
| **Global Timeout** | `globalTimeout` | `0` (disabled) | Hard limit on the entire test suite run across all files. |

---

## 3. Essential CLI Commands Reference

### Running Tests

```bash
# Run all tests across all configured projects
npx playwright test

# Run tests in interactive UI Mode (Time travel + DOM inspector)
npx playwright test --ui

# Run only on a specific project (e.g. Chromium only)
npx playwright test --project=chromium

# Run a specific test file
npx playwright test e2e/checkout.spec.ts

# Run tests matching a specific title or tag
npx playwright test -g "redirects to dashboard"

# Run tests in headed mode (visible browser window)
npx playwright test --headed

# Run tests in debug mode (opens Playwright Inspector)
npx playwright test --debug
```

### Inspecting Reports & Traces

```bash
# Open the latest HTML test report
npx playwright show-report

# Open a specific trace archive file (.zip) in Trace Viewer
npx playwright show-trace test-results/checkout-trace.zip
```

### Generating Code & Locators

```bash
# Launch interactive Codegen recorder
npx playwright codegen http://localhost:3000

# Codegen with mobile viewport emulation
npx playwright codegen --device="iPhone 13" http://localhost:3000
```

### Maintenance & Updating

```bash
# Check current Playwright version
npx playwright --version

# Update Playwright test package to latest
npm install -D @playwright/test@latest

# Download matching browser binaries with system dependencies
npx playwright install --with-deps
```
