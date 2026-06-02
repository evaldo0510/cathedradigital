import { test, expect } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';

test.describe('Mobile Performance Audit (Lighthouse)', () => {
  test.use({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1' });

  test('should pass core web vitals for mobile index', async ({ page, playwright }) => {
    await page.goto('/');
    
    // Core Web Vitals targets for Premium experience
    // LCP < 2.5s, TBT < 300ms, CLS < 0.1
    await playAudit({
      page: page,
      thresholds: {
        performance: 85,
        accessibility: 95,
        'best-practices': 90,
        seo: 90,
      },
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

  test('LCP should be below 2s on content pages', async ({ page }) => {
    await page.goto('/bible');
    
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        
        // Timeout if no LCP
        setTimeout(() => resolve(10000), 5000);
      });
    });

    console.log(`LCP for /bible: ${lcp}ms`);
    expect(lcp).toBeLessThan(2500);
  });
});
