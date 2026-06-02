import { test, expect } from '@playwright/test';

test.describe('Mobile Layout Shift Tracing', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('should not have significant layout shifts during initialization', async ({ page }) => {
    // Start tracing to capture layout shifts
    await page.context().tracing.start({ screenshots: true, snapshots: true });
    
    await page.goto('/');
    
    // Perform a standard scroll to trigger lazy loads
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(1000);
    await page.evaluate(() => window.scrollTo(0, 0));

    // Calculate CLS via Web Vitals in-page
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let cumulativeLayoutShiftScore = 0;
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              cumulativeLayoutShiftScore += (entry as any).value;
            }
          }
        }).observe({type: 'layout-shift', buffered: true});

        // Resolve after a timeout or when content is loaded
        setTimeout(() => resolve(cumulativeLayoutShiftScore), 3000);
      });
    });

    console.log(`Measured Initialization CLS: ${cls}`);
    
    // Stop tracing
    await page.context().tracing.stop({ path: 'reports/trace-cls.zip' });

    // Strict budget for Premium experience: CLS < 0.05 during init
    expect(cls).toBeLessThan(0.05);
  });
});
