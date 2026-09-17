# 12 Critical Playwright E2E Anti-Patterns

Avoid these common traps to keep your E2E suite fast, maintainable, and deterministic.

---

### 1. ❌ Using Arbitrary Sleep (`page.waitForTimeout`)
- **Anti-Pattern:** Inserting `await page.waitForTimeout(5000)` or `setTimeout` to wait for elements to load.
- **Why it hurts:** Tests become unnecessarily slow (adds dead time on fast machines) or flaky (fails on slow CI runners when 5s isn't enough).
- **Solution:** Rely on Playwright's built-in auto-waiting and Web-First assertions (`await expect(locator).toBeVisible()`).

---

### 2. ❌ Using Brittle CSS Classes or Long XPaths
- **Anti-Pattern:** `page.locator('button.btn.btn-primary.submit-btn-v2.mt-2')` or `page.locator('//div[2]/table/tbody/tr[1]/td[3]/button')`.
- **Why it hurts:** Breaks the moment Tailwind classes are tweaked or HTML markup is restructured.
- **Solution:** Use user-facing accessible locators: `page.getByRole('button', { name: 'Submit' })`.

---

### 3. ❌ Synchronous State Checks Instead of Web-First Assertions
- **Anti-Pattern:**
  ```typescript
  // ❌ Synchronous - evaluated once without waiting, causes flaky tests:
  const isVisible = await page.getByText('Success').isVisible();
  expect(isVisible).toBe(true);
  ```
- **Why it hurts:** Does not poll or wait for asynchronous DOM transitions.
- **Solution:**
  ```typescript
  // ✅ Web-First assertion - polls and auto-retries until timeout:
  await expect(page.getByText('Success')).toBeVisible();
  ```

---

### 4. ❌ Re-logging In via UI in Every Single Test
- **Anti-Pattern:** Filling username and password on the `/login` page at the start of all 50 test cases.
- **Why it hurts:** Adds 10–20 minutes to CI execution time and makes every test vulnerable to login form glitches.
- **Solution:** Authenticate once in a setup project and reuse session state via `storageState` (`playwright/.auth/user.json`).

---

### 5. ❌ Testing 30 Permutations of Validation Logic in E2E
- **Anti-Pattern:** Creating 30 E2E tests for every invalid email format, phone number boundary, and tax calculation.
- **Why it hurts:** Bloats the E2E suite. Browser launches and page navigations are orders of magnitude slower than pure code.
- **Solution:** Apply the **Testing Trophy**. Test granular input boundaries in fast Unit Tests (`swe-test-unit-test-writer`). Keep E2E focused on 1 happy path and 1 major negative journey.

---

### 6. ❌ The "God Test" (Cramming Multiple User Stories in One Block)
- **Anti-Pattern:** A 200-line test that registers a user, edits their profile, creates an organization, invites a member, and deletes the account.
- **Why it hurts:** When line 40 fails, none of the remaining steps run. Debugging which exact capability failed in CI becomes agonizing.
- **Solution:** Follow "One Behavior Per Test". Divide into small, isolated scenarios with clear setup.

---

### 7. ❌ Ambiguous or Vague Test Titles
- **Anti-Pattern:** `test('login')`, `test('test 1')`, `test('should work')`, `test('user action')`.
- **Why it hurts:** When the test fails on CI, the notification report provides zero actionable insight into what business rule failed.
- **Solution:** Use `[expected behavior] when [scenario or condition]`. Example: `test('shows validation error when email format is invalid', ...)`.

---

### 8. ❌ Test Pollution and State Sharing
- **Anti-Pattern:** Test 2 relies on data created by Test 1 (e.g. Test 1 creates item "XYZ", Test 2 clicks "XYZ").
- **Why it hurts:** Running tests in parallel or running Test 2 alone causes immediate failure.
- **Solution:** Ensure each test is self-sufficient: seed unique test data per test or use isolated fixtures.

---

### 9. ❌ Misusing CI Retries as a Band-Aid for Flakiness
- **Anti-Pattern:** Setting `retries: 3` in `playwright.config.ts` and ignoring tests that fail on run 1 and pass on retry.
- **Why it hurts:** Hides genuine timing bugs, race conditions, and memory leaks.
- **Solution:** Retries are strictly an insurance policy against transient network drops. If a test consistently requires retries, open its Trace Viewer and fix the underlying locator or race condition.

---

### 10. ❌ Missing `await` on Asynchronous Calls
- **Anti-Pattern:**
  ```typescript
  // ❌ Missing await!
  page.getByRole('button', { name: 'Save' }).click();
  expect(page.getByText('Saved')).toBeVisible();
  ```
- **Why it hurts:** In JavaScript/TypeScript, promises execute out of order or fail silently without `await`.
- **Solution:** Always prefix actions and web-first assertions with `await`.

---

### 11. ❌ Race Conditions When Handling New Tabs / Popups
- **Anti-Pattern:**
  ```typescript
  // ❌ Click happens before listener is registered!
  await page.getByRole('link', { name: 'Open Window' }).click();
  const newPage = await context.waitForEvent('page');
  ```
- **Why it hurts:** The popup may open and trigger the event before `waitForEvent` attaches, hanging the test until timeout.
- **Solution:** Always wrap the listener and the trigger in `Promise.all`:
  ```typescript
  const [newPage] = await Promise.all([
    context.waitForEvent('page'),
    page.getByRole('link', { name: 'Open Window' }).click(),
  ]);
  ```

---

### 12. ❌ Committing `test.only` to Version Control
- **Anti-Pattern:** Leaving `test.only(...)` active in the codebase when pushing a Git commit.
- **Why it hurts:** Skips the entire test suite on CI except for that single test, giving a false sense of security.
- **Solution:** Enable `forbidOnly: !!process.env.CI` in `playwright.config.ts` so CI immediately rejects accidental `test.only` commits.
