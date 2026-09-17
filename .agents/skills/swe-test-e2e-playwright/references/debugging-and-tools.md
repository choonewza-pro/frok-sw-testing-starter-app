# Debugging, Developer Tools, and AI Agent Integration

## 1. Trace Viewer: Playwright's Superpower

**Trace Viewer** is a post-mortem progressive debugging GUI tool. When configured with `trace: 'on-first-retry'` or `'retain-on-failure'`, Playwright captures an exact operational recording of the test execution without slowing down successful runs.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Playwright Trace Viewer                         │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Filmstrip / Timeline: [Screenshot 1] [Screenshot 2] [Screenshot 3] │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────┬─────────────────────────────────────┐ │
│ │ Action Steps List            │ Live DOM Snapshot at Selected Step  │ │
│ │  ▶ page.goto('/login')       │ - Before Action                     │ │
│ │  ▶ page.fill('alice')        │ - Action (Red dot target click)     │ │
│ │  ▼ page.click('Submit') [FAIL│ - After Action                      │ │
│ ├──────────────────────────────┼─────────────────────────────────────┤ │
│ │ Console Logs                 │ Network Requests & Payload          │ │
│ │ [Error 500: Auth failed]     │ POST /api/login -> 500 Bad Request  │ │
│ └──────────────────────────────┴─────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### What Trace Viewer Records

- **Time-Travel Snapshots:** Inspect the full DOM tree before, during, and after each individual action.
- **Visual Action Pointer:** Shows an exact red dot target where the mouse clicked or hovered.
- **Network Har Log:** Complete record of all HTTP requests, headers, response payloads, and timing.
- **Console & Source Code:** Exact line of TypeScript source that triggered the error with active variables.

```bash
# Open trace file recorded from CI/local run:
npx playwright show-trace test-results/checkout-trace.zip
```

---

## 2. Interactive UI Mode (`--ui`)

Playwright UI Mode provides an interactive development environment with live watch mode and time travel:

```bash
npx playwright test --ui
```

### Core Features

1. **Watch Mode:** Automatically re-runs test specs as soon as you save code changes.
2. **Locator Picker:** Point-and-click directly on the live preview to copy the optimal role-based locator.
3. **Step Scrubber:** Drag the timeline slider back and forth to observe DOM state mutations frame-by-frame.
4. **Project Switcher:** Toggle between Chromium, WebKit, and Mobile viewports with one click.

---

## 3. Playwright Inspector (`--debug`)

To pause test execution step-by-step and interact with the page via the terminal:

```bash
# Debug all tests
npx playwright test --debug

# Debug a specific test file
npx playwright test e2e/checkout.spec.ts --debug
```

- Clicking **Resume** proceeds to the next breakpoint or test action.
- Clicking **Step over** runs a single line of test code.
- Entering `playwright.$('selector')` in the browser devtools console allows testing locators interactively.

---

## 4. Built-in Reporters & CI/CD Integration

Playwright supports multiple output reporting formats simultaneously:

```typescript
// playwright.config.ts
reporter: [
  ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ['list'],
  ['junit', { outputFile: 'results/junit.xml' }],
  ['json', { outputFile: 'results/results.json' }],
],
```

### GitHub Actions CI Workflow Example (`.github/workflows/playwright.yml`)

```yaml
name: Playwright Tests
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: lts/*
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers with OS dependencies
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: npx playwright test

      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## 5. Playwright MCP & AI Test Agents

Modern QA automation integrates AI agents directly into the test lifecycle:

```
┌────────────────────────────────────────────────────────┐
│                   AI Agent Ecosystem                   │
│                                                        │
│  🎭 Test Planner    ──► Explores app & creates specs   │
│  🎭 Test Generator  ──► Converts specs to Playwright   │
│  🎭 Test Healer     ──► Self-heals broken locators     │
└──────────────────────────┬─────────────────────────────┘
                           │ controls via
┌──────────────────────────▼─────────────────────────────┐
│                 Playwright MCP Server                  │
│    Translates LLM tool calls directly to browser       │
│    actions via Accessibility Tree (CDP)                │
└────────────────────────────────────────────────────────┘
```

- **Playwright MCP (Model Context Protocol):** Connects LLMs directly to live browser sessions. Rather than parsing raw HTML, it feeds the browser's clean Accessibility Tree to the LLM, enabling reliable clicking, navigation, and state verification.
- **The 3 AI Agents:**
  - **Planner:** Crawls web applications, identifies user flows, and generates structured test plans.
  - **Generator:** Converts user journey specifications into TypeScript POM and test specs.
  - **Healer:** Detects when a selector broke due to a redesign, analyzes Trace Viewer diffs, and automatically updates locators to restore passing tests.
