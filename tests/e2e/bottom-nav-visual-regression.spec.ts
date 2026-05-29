import { test, expect } from '@playwright/test';

const MOBILE_VIEWPORTS = [
  { name: 'iphone-se', width: 320, height: 568 },
  { name: 'mobile-360', width: 360, height: 800 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-430', width: 430, height: 932 },
];

const THEMES = ['light', 'dark'];

test.describe('BottomNav & SwipeNavigation Visual Regression', () => {
  for (const viewport of MOBILE_VIEWPORTS) {
    for (const theme of THEMES) {
      test(`Visual regression for BottomNav on ${viewport.name} [${theme}]`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        // Navigate to a page with BottomNav
        await page.goto(`/?lang=pt&theme=${theme}`);
        await page.waitForLoadState('networkidle');
        
        // Wait for potential animations to settle
        await page.waitForTimeout(1000);

        // Targeted screenshot of the BottomNav
        const bottomNav = page.locator('.bottom-nav');
        await expect(bottomNav).toBeVisible();
        
        await expect(bottomNav).toHaveScreenshot(`bottom-nav-${viewport.name}-${theme}.png`, {
          maxDiffPixelRatio: 0.02,
        });
      });

      test(`Visual regression for active Bible on ${viewport.name} [${theme}]`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        await page.goto(`/bible?lang=pt&theme=${theme}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const bottomNav = page.locator('.bottom-nav');
        await expect(bottomNav).toHaveScreenshot(`bottom-nav-bible-active-${viewport.name}-${theme}.png`, {
          maxDiffPixelRatio: 0.02,
        });
      });
    }
  }
});
