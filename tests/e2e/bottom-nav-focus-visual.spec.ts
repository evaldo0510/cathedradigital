import { test, expect } from '@playwright/test';

const MOBILE_VIEWPORTS = [
  { name: 'mobile-360', width: 360, height: 800 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-430', width: 430, height: 932 },
];

const THEMES = ['light', 'dark'];

test.describe('BottomNav Focus States Visual Regression', () => {
  for (const viewport of MOBILE_VIEWPORTS) {
    for (const theme of THEMES) {
      test(`Focus state for BottomNav on ${viewport.name} [${theme}]`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        await page.goto(`/?lang=pt&theme=${theme}`);
        await page.waitForLoadState('networkidle');
        
        const bibleItem = page.locator('button[aria-label="Bíblia"]');
        
        // Trigger focus-visible
        // In many browsers, simple .focus() might not trigger focus-visible if not preceded by keyboard action
        // We press Tab to ensure focus-visible is triggered
        await page.keyboard.press('Tab');
        
        // Tab until Bible is focused if necessary, or just focus it and hope it applies focus-visible styles
        // because we are in a "keyboard" mode now
        await bibleItem.focus();
        
        // Small wait for any focus rings to render
        await page.waitForTimeout(200);

        const bottomNav = page.locator('.bottom-nav');
        await expect(bottomNav).toHaveScreenshot(`bottom-nav-focus-bible-${viewport.name}-${theme}.png`, {
          maxDiffPixelRatio: 0.05, // Focus rings can be slightly different across browsers
        });
      });
    }
  }
});
