---
name: swe-test-e2e-playwright
description: >
  Guides AI agents to write reliable, maintainable End-to-End (E2E) tests
  using Playwright with TypeScript. Covers resilient locators (getByRole, getByLabel),
  web-first assertions with auto-retry, Page Object Model (POM), test isolation via BrowserContext,
  authentication state sharing (storageState), multi-tab handling, configuration (playwright.config.ts),
  debugging tools (Trace Viewer, UI Mode, Codegen), network mocking (page.route), and CI/CD integration.
  Use when asked to "write Playwright tests", "เขียน E2E test", "test หน้าเว็บด้วย Playwright",
  "สร้าง E2E test", "setup Playwright", or to produce .spec.ts files.
license: Apache-2.0
allowed-tools: ReadFile, ListDirectory, RunCommand, WriteFile
metadata:
  author: choonewza
  version: "0.1"
---

## Overview

You are an expert End-to-End (E2E) test automation engineer specializing in **Playwright** with **TypeScript**.

> **E2E Testing Mindset (System-Level Confidence):**
> การเขียน E2E Test ไม่ใช่การทดสอบ function ย่อยๆ แต่คือการ **จำลองพฤติกรรมการใช้งานของผู้ใช้จริงตั้งแต่ต้นจนจบ (Simulate Real User Journeys)**
> เพื่อพิสูจน์ว่าทุกระบบทำงานเชื่อมต่อกันได้อย่างสมบูรณ์ (Frontend + Backend + Database + APIs):
>
> 1. **System-Level Confidence:** ในขณะที่ Unit/Integration Test ให้ Code-level confidence, Playwright มอบ System-level confidence ว่า "ผู้ใช้งานจริงจะใช้งานระบบได้สำเร็จ"
> 2. **Resilient, User-Centric Locators:** ค้นหา element เสมือนมุมมองของผู้ใช้ (Role, Label, Text) ห้ามยึดติดกับ CSS class หรือ XPath ที่เปราะบาง
> 3. **Auto-Waiting & Zero Flakiness:** พึ่งพา auto-waiting และ web-first assertions ที่มี built-in retry ในตัว ห้ามใช้ `waitForTimeout()` หรือ arbitrary sleep เด็ดขาด
> 4. **Strict Test Isolation:** ทุก test case ต้องทำงานบน Browser Context ใหม่ที่สะอาดเสมือนเปิด Incognito window ไร้การปนเปื้อนของ session/cookie ระหว่างกัน
> 5. **High Execution Speed:** เพิ่มความเร็วด้วยการรัน parallel workers ในตัว และ reuse authentication state ผ่าน `storageState` แทนการล็อกอินผ่าน UI ซ้ำซาก

Your job is to produce `.spec.ts` files and Page Object Models that are:
- **Resilient** — ไม่พังเมื่อ UI ปรับเปลี่ยน layout หรือ CSS classes
- **Fast & Isolated** — แต่ละ test มีอิสระต่อกัน รันแบบ parallel ได้อย่างมั่นใจ
- **Maintainable** — ใช้ Page Object Model (POM) เพื่อแยก interaction logic ออกจาก test specification
- **Observable** — ตั้งชื่อ test ตาม format `[expected behavior] when [scenario]` และพร้อม debug ผ่าน Trace Viewer

**Scope:** End-to-End browser testing and user journey automation.
- For pure isolated unit tests (Jest/Vitest), use `swe-test-unit-test-writer`.
- For API-to-database and backend integration tests, use `swe-test-integration-test-writer`.
- For test case design (BVA / EP tables), reference `swe-test-engineer`.
- For test prioritization and risk mapping, reference `swe-test-planner`.

---

## Detailed References

For deep dives and patterns, see the specialized references:

- [references/architecture-and-isolation.md](references/architecture-and-isolation.md) — 3-tier architecture, WebSocket protocol, CDP+, Browser vs BrowserContext vs Page, test isolation mechanics.
- [references/locators-and-selectors.md](references/locators-and-selectors.md) — Priority hierarchy (getByRole > getByLabel > getByPlaceholder > getByText > getByTestId > CSS > XPath), chaining, filtering (`.filter()`), Codegen.
- [references/actions-and-assertions.md](references/actions-and-assertions.md) — User actions, auto-waiting criteria, Web-First Assertions with auto-retry, network route mocking (`page.route()`).
- [references/naming-and-hierarchy.md](references/naming-and-hierarchy.md) — Test hierarchy (Root → Project → File → Suite → Case → Action), naming standard `[expected behavior] when [scenario]`, hooks and annotations.
- [references/page-object-model.md](references/page-object-model.md) — Page Object Model (POM) pattern, component objects, TypeScript typings, maintainability.
- [references/authentication-and-fixtures.md](references/authentication-and-fixtures.md) — Reusable auth with `storageState`, setup projects, custom fixtures (`test.extend`), test data idempotency.
- [references/configuration-and-cli.md](references/configuration-and-cli.md) — `playwright.config.ts`, multi-project browsers/devices, webServer, timeouts matrix, essential CLI flags.
- [references/multi-tab-and-browser-management.md](references/multi-tab-and-browser-management.md) — Handling popups & tabs (`waitForEvent('page')`), downloads, dialogs, viewport/locale options.
- [references/debugging-and-tools.md](references/debugging-and-tools.md) — UI Mode (time travel), Trace Viewer, Inspector, built-in reporters, Playwright MCP & AI Test Agents.
- [references/anti-patterns.md](references/anti-patterns.md) — 12 critical anti-patterns (arbitrary sleeps, fragile CSS, testing 30 math branches in E2E, ambiguous titles, flaky retry misuse).
- [references/examples.md](references/examples.md) — Complete runnable examples (E-commerce journey, Auth & Protected routes, POM structure, external popup).

---

## When to Activate

Activate when the user:
- Asks to write, fix, or refactor End-to-End (E2E) browser tests with Playwright
- Mentions "เขียน E2E test", "test หน้าเว็บ", "Playwright test", "เขียน test playwright"
- Needs to test user journeys: Login, Add to Cart, Multi-step forms, Checkout, File upload/download, Multi-tab flows
- Asks to configure `playwright.config.ts`, set up CI/CD workflows (GitHub Actions), or configure mobile emulation
- Needs to debug flaky Playwright tests, examine Trace Viewer files, or run interactive tests via UI Mode
- Needs to create Page Object Models (POM) for web applications

Do NOT activate when:
- The user wants pure unit tests for functions/classes without browser interaction → use `swe-test-unit-test-writer`
- The user wants backend API-to-Database integration tests without browser UI → use `swe-test-integration-test-writer`
- The user needs boundary value analysis (BVA) or equivalence partitioning (EP) design tables → use `swe-test-engineer`
- The user needs risk-based prioritization of what to test first → use `swe-test-planner`

---

## Golden Rules for Playwright E2E Tests

1. 🎯 **Follow User-Facing Locator Hierarchy:** Always prioritize accessible locators:
   `getByRole()` > `getByLabel()` > `getByPlaceholder()` > `getByText()` > `getByTestId()` >>> CSS / XPath.
2. ⏱️ **Never Use Arbitrary Sleep:** NEVER call `page.waitForTimeout()`, `sleep()`, or `setTimeout()`. Playwright's auto-waiting and web-first assertions handle all timing automatically.
3. 🔒 **Maintain Absolute Test Isolation:** Never share state (cookies, storage, mutable DB records) across test cases. Every test case gets an isolated BrowserContext.
4. ⚡ **Authenticate Once, Reuse via `storageState`:** Do not go through the manual UI login form in every single test case. Log in once during setup and reuse `storageState`.
5. 🏷️ **Name Tests for Living Documentation:** Use `[expected behavior] when [scenario or condition]`. Example: `test('shows error message when password is invalid', ...)`. One test must verify exactly one primary behavior.
6. 🧩 **Encapsulate UI into Page Object Models (POM):** When tests span multiple steps or are reused, abstract locators and operations into Page Objects to prevent brittle selector duplication.
7. 📦 **Generate Unique Test Data:** In parallel runs, prevent collision by generating unique emails/names (e.g. `user-${Date.now()}@example.com`).

---

## Playwright 3-Tier Architecture

Understanding Playwright's internals explains why it is radically faster and more stable than legacy tools:

```mermaid
flowchart TD
    subgraph Layer1["Layer 1: Test Code (Client)"]
        TC["TypeScript / JavaScript Test Runner"]
    end

    subgraph Layer2["Layer 2: Playwright Server (Command Center)"]
        PS["Playwright Server<br/>• Auto-wait & Retry<br/>• Network Interception<br/>• Tracing & Screenshots<br/>• Context Isolation"]
    end

    subgraph Layer3["Layer 3: Browser Engines"]
        CR["Chromium"]
        FF["Firefox (Patched)"]
        WK["WebKit (Patched)"]
    end

    TC -- "WebSocket (Persistent, Bidirectional)" --> PS
    PS -- "CDP+ Protocol (Direct Process Control)" --> CR
    PS -- "CDP+ Protocol" --> FF
    PS -- "CDP+ Protocol" --> WK
```

- **WebSocket Connection:** Client and server maintain a single persistent connection. There is no HTTP request overhead per command like Selenium WebDriver.
- **CDP+ (Chrome DevTools Protocol Plus):** Playwright directly controls browser engines via patched protocol layers, avoiding separate vendor drivers (chromedriver, geckodriver).

---

## 5-Step Workflow for Writing E2E Tests

### Step 1: Inspect Project Stack & Playwright Config
Check `package.json` and `playwright.config.ts`. Confirm:
- `baseURL` is defined (e.g. `http://localhost:3000`)
- `webServer` is configured to start local dev servers automatically
- Required browser projects are defined (Desktop Chrome, Firefox, Safari, Mobile)

```bash
# If Playwright is not yet installed:
npm init playwright@latest
```

### Step 2: Outline User Journey & Scenarios
Identify the target flow. Formulate test cases answering:
- **What is the entry point?** (URL or page)
- **What actions does the user perform?** (Fill inputs, click buttons, select options)
- **What is the expected outcome to assert?** (URL change, visible confirmation toast, new item rendered)

### Step 3: Select Resilient Locators
Use the **Locator Hierarchy**:
```typescript
// 1. Best: Semantic role with accessible name
page.getByRole('button', { name: 'Submit order' })

// 2. Form input by associated label
page.getByLabel('Email address')

// 3. Filter within list items
page.getByRole('listitem').filter({ hasText: 'Wireless Mouse' })
```
*(Avoid `page.locator('.btn-primary.checkout-btn')` or `//div[2]/button`)*

### Step 4: Encapsulate in Page Object Models (If Multi-step)
Create reusable Page classes under `tests/pages/` or `e2e/pages/`:
```typescript
export class CheckoutPage {
  constructor(private readonly page: Page) {}

  readonly orderTotal = this.page.getByTestId('order-total');
  readonly placeOrderButton = this.page.getByRole('button', { name: 'Place order' });

  async placeOrder() {
    await this.placeOrderButton.click();
  }
}
```

### Step 5: Write Web-First Assertions & Execute
Write standard `.spec.ts` files with clear naming:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test('redirects to confirmation page when payment is completed', async ({ page }) => {
    // Act
    await page.goto('/checkout');
    await page.getByRole('button', { name: 'Confirm Payment' }).click();

    // Assert (Web-First with auto-retry)
    await expect(page).toHaveURL(/.*checkout\/success/);
    await expect(page.getByRole('heading', { name: 'Thank you for your order' })).toBeVisible();
  });
});
```

Run and debug:
```bash
# Interactive UI mode with time-travel:
npx playwright test --ui

# Run specific spec:
npx playwright test tests/checkout.spec.ts

# Inspect failure trace:
npx playwright show-trace test-results/checkout-trace.zip
```

---

## Locator Priority Decision Tree

Use this quick guide to choose the correct locator:

| Priority | Locator | When to Use | Example |
| :--- | :--- | :--- | :--- |
| **1 (Best)** | `getByRole()` | Interactive elements (buttons, headings, checkboxes, dialogs) | `page.getByRole('button', { name: 'Save' })` |
| **2** | `getByLabel()` | Form input fields with associated `<label>` | `page.getByLabel('Password')` |
| **3** | `getByPlaceholder()` | Input fields with placeholder text (when label is absent) | `page.getByPlaceholder('Search products...')` |
| **4** | `getByText()` | Static non-interactive text content | `page.getByText('Order completed successfully')` |
| **5** | `getByTestId()` | Dynamic or custom widgets lacking accessible semantics | `page.getByTestId('user-avatar-badge')` |
| **6 (Fallback)** | `locator()` CSS | Complex layout CSS selectors when no other locator works | `page.locator('article.featured-card')` |
| **7 (Avoid)** | `XPath` | Fragile DOM paths (avoid in modern codebases) | `page.locator('xpath=//tr[2]/td[1]')` |

---

## Web-First Assertions Cheat Sheet

Playwright assertions automatically poll and retry until the condition is met or the timeout is reached:

```typescript
// Visibility
await expect(page.getByRole('dialog')).toBeVisible();
await expect(page.getByText('Loading...')).toBeHidden();

// Text & Value
await expect(page.getByTestId('status')).toHaveText('Shipped');
await expect(page.getByTestId('summary')).toContainText('Total: $99');
await expect(page.getByLabel('Username')).toHaveValue('johndoe');

// Page & Navigation
await expect(page).toHaveURL(/.*dashboard/);
await expect(page).toHaveTitle(/Store Portal/);

// Form Controls State
await expect(page.getByRole('checkbox', { name: 'Subscribe' })).toBeChecked();
await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled();
await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();

// Count
await expect(page.getByRole('listitem')).toHaveCount(5);
```

---

## Summary Checklist Before Finalizing Tests

- [ ] **No `sleep` or `waitForTimeout`:** Only web-first assertions and auto-wait actions are used.
- [ ] **User-Facing Locators:** `getByRole` and `getByLabel` are prioritized over CSS classes and XPath.
- [ ] **Descriptive Naming:** Uses `[expected behavior] when [scenario or condition]`.
- [ ] **One Behavior Per Test:** Test cases do not test 5 unrelated features in a single test block.
- [ ] **Independent & Isolated:** Tests can run in parallel in random order without cross-pollution.
- [ ] **Auth Cached:** Tests requiring authentication reuse `storageState` instead of logging in via UI every time.
- [ ] **Trace Viewer Ready:** Configured with `trace: 'on-first-retry'` or `'retain-on-failure'`.
