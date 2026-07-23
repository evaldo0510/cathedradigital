/**
 * Lighthouse CI — Tablet (iPad Mini, 4G rápido).
 */
const path = require('path');

module.exports = {
  ci: {
    collect: {
      url: (process.env.LH_ROUTES || '/profile')
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean)
        .map((r) => (process.env.LH_BASE_URL || 'http://localhost:8080') + r),
      numberOfRuns: 3,
      puppeteerScript: path.resolve(__dirname, 'scripts/lighthouse-puppeteer-login.mjs'),
      puppeteerLaunchOptions: { args: ['--no-sandbox', '--disable-dev-shm-usage'] },
      settings: {
        preset: 'desktop',
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 768,
          height: 1024,
          deviceScaleFactor: 2,
          disabled: false,
        },
        throttlingMethod: 'simulate',
        throttling: {
          rttMs: 70,
          throughputKbps: 5120,
          cpuSlowdownMultiplier: 2,
          requestLatencyMs: 280,
          downloadThroughputKbps: 4608,
          uploadThroughputKbps: 1024,
        },
        emulatedUserAgent:
          'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        budgetPath: path.resolve(__dirname, 'budgets/profile.json'),
        onlyCategories: ['performance'],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.15 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};
