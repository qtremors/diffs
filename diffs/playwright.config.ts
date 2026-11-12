import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
  (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);
const chromium = { browserName: "chromium" as const, launchOptions: { executablePath } };

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...chromium, viewport: { width: 1440, height: 1000 } } },
    { name: "mobile-chromium", use: { ...chromium, viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } },
    { name: "small-chromium", use: { ...chromium, viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true } },
    { name: "tablet-chromium", use: { ...chromium, viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true } },
    { name: "firefox", use: { browserName: "firefox", viewport: { width: 1440, height: 1000 } } },
    { name: "webkit", use: { browserName: "webkit", viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: "npm run build && npm run start -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
