import { test, expect } from '@playwright/test';

const targetPages = [
  { name: 'Dashboard', path: '/' },
  { name: 'Bible', path: '/bible' },
  { name: 'Catechism', path: '/catechism' },
  { name: 'Itineraria', path: '/itineraria' },
  { name: 'Profile', path: '/profile' },
  { name: 'Magisterium', path: '/magisterium' },
];

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'mobile-landscape', width: 812, height: 375 },
  { name: 'tablet-portrait', width: 834, height: 1112 },
  { name: 'tablet-landscape', width: 1112, height: 834 },
  { name: 'foldable-portrait', width: 512, height: 800 },
  { name: 'foldable-landscape', width: 1024, height: 600 },
  { name: 'desktop', width: 1440, height: 900 },
];

test.describe('Layout Consolidation Regression', () => {
  for (const pageInfo of targetPages) {
    for (const viewport of viewports) {
      test(`Visual regression for ${pageInfo.name} on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(pageInfo.path);
        
        // Wait for ContemplativeLayout to be visible
        const main = page.locator('main');
        await expect(main).toBeVisible();

        // Verify max-width consistency
        if (viewport.width > 1400) {
          const boundingBox = await main.boundingBox();
          expect(boundingBox?.width).toBeLessThanOrEqual(1400);
        }

        // Snapshot comparison
        await expect(page).toHaveScreenshot(`${pageInfo.name}-${viewport.name}.png`, {
          fullPage: true,
          maxDiffPixelRatio: 0.05,
        });
      });
    }
  }
});
