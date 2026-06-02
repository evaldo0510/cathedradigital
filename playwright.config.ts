import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E tests.
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only to reduce flakiness without masking local errors */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI to increase stability. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['junit', { outputFile: 'playwright-report/results.xml' }],
    ['list'],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:8080',

    /* Stability filters: Add timeouts to prevent hangs */
    actionTimeout: 15000,
    navigationTimeout: 30000,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'on',
    ignoreHTTPSErrors: true,
  },
  /* Configure threshold for visual regression */
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    },
  },

  /* Configure projects for major browsers */
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
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'tablet-safari',
      use: { ...devices['iPad Air'] },
    },
    /* Extended Mobile Matrix */
    {
      name: 'mobile-320',
      use: { ...devices['iPhone SE'], viewport: { width: 320, height: 568 } },
    },
    {
      name: 'mobile-360',
      use: { viewport: { width: 360, height: 800 }, deviceScaleFactor: 3 },
    },
    {
      name: 'mobile-375-iphone8',
      use: { ...devices['iPhone 8'], viewport: { width: 375, height: 667 } },
    },
    {
      name: 'mobile-414-iphone8plus',
      use: { ...devices['iPhone 8 Plus'], viewport: { width: 414, height: 736 } },
    },
    {
      name: 'mobile-390',
      use: { ...devices['iPhone 13'], viewport: { width: 390, height: 844 } },
    },
    {
      name: 'mobile-412',
      use: { ...devices['Pixel 7'], viewport: { width: 412, height: 915 } },
    },
    {
      name: 'mobile-480',
      use: { viewport: { width: 480, height: 853 }, deviceScaleFactor: 2 },
    },
    {
      name: 'ipad-portrait',
      use: { ...devices['iPad Pro 11'], viewport: { width: 768, height: 1024 } },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: true,
  },
});
