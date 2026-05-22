import { test, expect } from '@playwright/test';

test.describe('Home Page Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home
    await page.goto('/');
    
    // 1. Force deterministic rendering by disabling all animations/transitions
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0s !important;
          scroll-behavior: auto !important;
        }
        .animate-pulse, .animate-bounce, .animate-spin {
          animation: none !important;
        }
      `
    });

    // 2. Set reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    // 3. Wait for fonts to be stable
    await page.evaluate(() => document.fonts.ready);
    
    // 4. Ensure images are loaded
    await page.waitForLoadState('networkidle');
    
    // 5. Wait for main content
    await page.waitForSelector('#main-content', { state: 'visible' });
    
    // 6. Mask or freeze dynamic text if necessary (e.g. current time/date)
    await page.evaluate(() => {
      const timeElements = document.querySelectorAll('time, .current-date');
      timeElements.forEach(el => {
        el.textContent = '01/01/2026';
      });
    });
  });

  const viewports = [
    { name: 'desktop', width: 1280, height: 720 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 }
  ];

  for (const vp of viewports) {
    test(`screenshot comparison for ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      
      // Give it a moment to settle after resize
      await page.waitForTimeout(500);

      // Take full page screenshot with masking of highly dynamic content
      await expect(page).toHaveScreenshot(`home-${vp.name}.png`, {
        fullPage: true,
        mask: [
          page.locator('#ritual-do-dia'),
          page.locator('#reading-progress'),
          page.locator('time'),
          page.locator('.animate-pulse'),
          page.locator('[data-dynamic="true"]'),
          page.locator('input[type="text"]'), // Mask search queries in inputs
        ],
        animations: 'disabled',
        maxDiffPixelRatio: 0.01, // Stricter threshold
        threshold: 0.1
      });
    });
  }
});
