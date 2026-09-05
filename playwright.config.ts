import { defineConfig, devices } from "@playwright/test"

// Playwright's failure-page snapshots are independent of screenshot and trace settings.
if (process.env.CRATE_LIVE_PDS === "1") process.env.PLAYWRIGHT_NO_COPY_PROMPT = "1"

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "**/*.pw.ts",
  fullyParallel: true,
  use: { baseURL: "http://127.0.0.1:5173", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
})
