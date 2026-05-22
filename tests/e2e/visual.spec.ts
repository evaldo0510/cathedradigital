import { test, expect } from '@playwright/test';

test.describe('Home Page Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home
    await page.goto('/');
    
    // Set reduced motion to avoid animation-related failures
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    // Wait for fonts to load
    await page.evaluate(() => document.fonts.ready);
    
    // Ensure all images are loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for main content to be visible
    await page.waitForSelector('#main-content', { state: 'visible' });
  });

  const viewports = [
    { name: 'desktop', width: 1280, height: 720 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 }
  ];

  for (const vp of viewports) {
    test(`screenshot comparison for ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      
      // Additional wait for any dynamic layouts to settle after resize
      await page.waitForTimeout(500);

      // Take full page screenshot with masking of dynamic components
      await expect(page).toHaveScreenshot(`home-${vp.name}.png`, {
        fullPage: true,
        mask: [
          page.locator('#ritual-do-dia'),
          page.locator('#reading-progress'),
          page.locator('time'),
          page.locator('.animate-pulse'), // Mask any skeletons
          page.locator('[data-dynamic="true"]') // General purpose dynamic tag
        ],
        animations: 'disabled',
        maxDiffPixelRatio: 0.02 // Allow small variations
      });
    });
  }
});
