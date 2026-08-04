import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT || 4173;
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? process.env.BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests/playwright",

  timeout: 60000,

  expect: {
    timeout: 10000,
  },

  fullyParallel: true,

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 2 : 0,

  workers: process.env.CI ? 2 : undefined,

  reporter: [
    [
      "html",
      {
        outputFolder: "playwright-report",
        open: "never",
      },
    ],

    ["list"],

    [
      "json",
      {
        outputFile: "playwright-report/results.json",
      },
    ],
  ],

  use: {
    baseURL: BASE_URL,

    trace: "retain-on-failure",

    screenshot: "only-on-failure",

    video: "retain-on-failure",

    actionTimeout: 15000,

    navigationTimeout: 30000,

    ignoreHTTPSErrors: true,

    viewport: {
      width: 1440,
      height: 900,
    },
  },

  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run preview",

        port: Number(PORT),

        reuseExistingServer: !process.env.CI,

        timeout: 120000,
      },

  projects: [
    {
      name: "Desktop Chromium",

      use: {
        ...devices["Desktop Chrome"],

        viewport: {
          width: 1440,
          height: 900,
        },
      },
    },

    {
      name: "Desktop Firefox",

      use: {
        ...devices["Desktop Firefox"],

        viewport: {
          width: 1440,
          height: 900,
        },
      },
    },

    {
      name: "Desktop Webkit",

      use: {
        ...devices["Desktop Safari"],

        viewport: {
          width: 1440,
          height: 900,
        },
      },
    },

    {
      name: "Mobile Android",

      use: {
        ...devices["Pixel 7"],
      },
    },

    {
      name: "Mobile iPhone",

      use: {
        ...devices["iPhone 14"],
      },
    },
  ],
});
