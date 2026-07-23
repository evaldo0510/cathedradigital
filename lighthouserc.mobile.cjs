/**
 * Lighthouse CI — Mobile (Moto G4, 4G Slow).
 * Roda o Lighthouse contra /profile com uma sessão autenticada preservada
 * em .lighthouseci/storage-state/session.json (gerada pelo login.mjs).
 */
const path = require('path');
const storageState = path.resolve(__dirname, '.lighthouseci/storage-state/session.json');

module.exports = {
  ci: {
    collect: {
      url: [
        (process.env.LH_BASE_URL || 'http://localhost:8080') + '/profile',
      ],
      numberOfRuns: 3,
      puppeteerScript: path.resolve(__dirname, 'scripts/lighthouse-puppeteer-login.mjs'),
      puppeteerLaunchOptions: {
        args: ['--no-sandbox', '--disable-dev-shm-usage'],
      },
      settings: {
        preset: 'desktop',
        // Override: emula mobile 4G real
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 412,
          height: 823,
          deviceScaleFactor: 1.75,
          disabled: false,
        },
        throttlingMethod: 'simulate',
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
          requestLatencyMs: 562.5,
          downloadThroughputKbps: 1474.56,
          uploadThroughputKbps: 675,
        },
        emulatedUserAgent:
          'Mozilla/5.0 (Linux; Android 11; Moto G4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
        budgetPath: path.resolve(__dirname, 'budgets/profile.json'),
        onlyCategories: ['performance'],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.7 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.15 }],
        'total-blocking-time': ['error', { maxNumericValue: 400 }],
        'interaction-to-next-paint': ['warn', { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
