import { test, expect } from '@playwright/test';

const pages = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Bible', path: '/bible' },
  { name: 'Catechism', path: '/catechism' },
  { name: 'Liturgia', path: '/liturgia' },
  { name: 'Magisterium', path: '/magisterium' },
  { name: 'Profile', path: '/profile' }
];

const viewports = [
  { width: 375, height: 812, name: 'iPhone X' },
  { width: 768, height: 1024, name: 'iPad' },
  { width: 1440, height: 900, name: 'Desktop' },
  { width: 1920, height: 1080, name: 'Large Desktop' }
];

test.describe('Layout Consolidation Visual Regression', () => {
  for (const pageInfo of pages) {
    for (const viewport of viewports) {
      test(`${pageInfo.name} on ${viewport.name} should maintain consistent layout`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(pageInfo.path, { waitUntil: 'networkidle' });
        
        // Wait for main content to be stable
        await page.waitForSelector('main', { state: 'visible' });
        
        // Capture specific layout metrics
        const mainBoundingBox = await page.locator('main').boundingBox();
        const layoutContainer = await page.locator('[data-layout-container="true"]').first();
        const containerBox = await layoutContainer.boundingBox();

        expect(mainBoundingBox).toBeDefined();
        expect(containerBox).toBeDefined();

        // Visual regression check with strict tolerance for layout shifts
        await expect(page).toHaveScreenshot(`${pageInfo.name}-${viewport.name}.png`, {
          maxDiffPixelRatio: 0.01,
          threshold: 0.1,
        });
      });
    }
  }

  test('AppHeader and ItinerariumStepPage Portal Audit', async ({ page }) => {
    await page.goto('/itinerarium/step/1', { waitUntil: 'networkidle' });
    
    // Check if header and content are properly aligned
    const header = page.locator('header');
    const content = page.locator('main');
    
    const headerBox = await header.boundingBox();
    const contentBox = await content.boundingBox();
    
    expect(headerBox?.width).toBeGreaterThan(0);
    expect(contentBox?.width).toBeGreaterThan(0);
    
    // Compare alignment
    if (headerBox && contentBox) {
      // In contemplative layout, they should share horizontal centering logic
      // though header might be full width, the internal content of header should align with main container
      const headerContent = header.locator('.max-w-spacing-4xl, .container, [data-layout-container="true"]').first();
      const headerContentBox = await headerContent.boundingBox();
      
      if (headerContentBox) {
        expect(Math.abs(headerContentBox.x - contentBox.x)).toBeLessThan(5);
      }
    }
    
    await expect(page).toHaveScreenshot('ItinerariumStepPage-Portal.png');
  });
});
