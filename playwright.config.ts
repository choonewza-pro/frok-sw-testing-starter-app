import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, ".env") });

export const authFile = 'playwright/.auth/admin.json';

/**
 * Playwright E2E config — tailored to this Next.js starter.
 * - Dev server runs on port 3030 (`npm run dev` already includes `--port 3030`)
 * - Specs live in `./e2e` so Vitest (`tests/**`) ignores them
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",

  timeout: 30 * 1000,

  expect: {
    timeout: 5 * 1000,
  },

  fullyParallel: true,

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 2 : 0,

  workers: process.env.CI ? 2 : 4,

  reporter: [
    ["html", { open: "never" }],
    ["list"],
  ],

  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3030",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10 * 1000,
  },

  // Output directory for test artifacts such as screenshots, videos, traces, etc.
  outputDir: "test-results/",

  // globalSetup: require.resolve("./e2e/global-setup.ts"),
  // globalTeardown: require.resolve("./e2e/global-teardown.ts"),

  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "chromium",
      use: { 
        ...devices["Desktop Chrome"],  
        storageState: authFile
      },
      dependencies: ["setup"],
     
    },
    // Uncomment to cover more browsers (also run `npx playwright install`):
    // { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    // { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3030",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    // ชี้ Course API ภายนอกไปที่ mock server (e2e/helpers/course-mock-server.mjs)
    // ซึ่ง global-setup สตาร์ทไว้ก่อนแล้ว — หมายเหตุ: ถ้า reuse dev server เดิมที่รันอยู่
    // (local) ค่านี้จะไม่มีผล ต้อง restart `npm run dev` หนึ่งครั้งให้รับ env ใหม่
    env: {
      COURSE_API_URL: "http://127.0.0.1:3939/api/course",
    },
  },
});
