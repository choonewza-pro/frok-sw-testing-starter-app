import { test as base, type Page } from "@playwright/test";
import { ADMIN_AUTH_FILE, USER_AUTH_FILE } from "./helpers/test-users";

/* eslint-disable react-hooks/rules-of-hooks -- `use` ตรงนี้คือ Playwright fixture API ไม่ใช่ React Hook */

type RoleFixtures = {
  adminPage: Page;
  userPage: Page;
};

/**
 * Isolated role contexts — แต่ละ test ได้ context ใหม่จากไฟล์ state
 * (เปิด Incognito ใหม่ทุกครั้ง ไม่แชร์ cookie ระหว่างเคส)
 */
export const test = base.extend<RoleFixtures>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: ADMIN_AUTH_FILE });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
  userPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: USER_AUTH_FILE });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from "@playwright/test";
