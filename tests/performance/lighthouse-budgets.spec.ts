import { test, expect } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';

const BUDGETS = [
  {
    path: '/',
    name: 'Home',
    thresholds: {
      performance: 90,
      'first-contentful-paint': 1500,
      'largest-contentful-paint': 2000,
      'total-blocking-time': 200,
      'cumulative-layout-shift': 0.05,
    }
  },
  {
    path: '/bible',
    name: 'Bible (Reading)',
    thresholds: {
      performance: 92,
      'first-contentful-paint': 1200,
      'largest-contentful-paint': 1800,
      'total-blocking-time': 150,
      'cumulative-layout-shift': 0.02,
    }
  }
];

test.describe('Mobile Lighthouse Budgets', () => {
  test.use({ 
    viewport: { width: 390, height: 844 }, 
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1' 
  });

  for (const budget of BUDGETS) {
    test(`Lighthouse audit for ${budget.name} with performance budgets`, async ({ page }) => {
      await page.goto(budget.path);
      
      // Wait for network to be idle to get stable metrics
      await page.waitForLoadState('networkidle');

      await playAudit({
        page: page,
        thresholds: budget.thresholds,
        port: 9222,
        opts: {
          formFactor: 'mobile',
          screenEmulation: {
            mobile: true,
            width: 390,
            height: 844,
            deviceScaleFactor: 3,
            disabled: false,
          },
        },
      });
    });
  }
});
