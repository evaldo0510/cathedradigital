import { test, expect } from '@playwright/test';

test.describe('Above the Fold Visual Integrity', () => {
  const mobileViewports = [
    { name: 'iPhone-SE', width: 375, height: 667 },
    { name: 'iPhone-14', width: 390, height: 844 },
    { name: 'Android-Large', width: 412, height: 915 },
  ];

  for (const vp of mobileViewports) {
    test(`Content visibility on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/bible');
      
      // Wait for content to settle
      await page.waitForTimeout(1000);

      // 1. Snapshot test for visual regression
      await expect(page).toHaveScreenshot(`above-the-fold-${vp.name}.png`, {
        fullPage: false, // Only viewport
        maxDiffPixelRatio: 0.02
      });

      // 2. Functional check: Content top position
      const results = await page.evaluate(() => {
        const header = document.querySelector('header');
        const headerRect = header?.getBoundingClientRect();
        const mainContent = document.getElementById('main-content');
        const contentTop = mainContent?.getBoundingClientRect().top || 0;
        const viewportHeight = window.innerHeight;
        
        return {
          headerHeight: headerRect?.height || 0,
          contentTop,
          viewportHeight,
          ratio: contentTop / viewportHeight
        };
      });

      console.log(`${vp.name} results:`, results);
      
      // Content must start within the top 20% of the screen
      // Ensuring it's clearly "above the fold"
      expect(results.contentTop).toBeLessThan(results.viewportHeight * 0.2);
      expect(results.headerHeight).toBeLessThan(50); // Premium limit: 36px (from CSS)
    });
  }
});
