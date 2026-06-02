import { test, expect } from '@playwright/test';

test.describe('Mobile Premium Constraints Audit', () => {
  const mobileViewports = [
    { name: 'iPhone-SE', width: 375, height: 667 },
    { name: 'iPhone-14', width: 390, height: 844 },
  ];

  for (const vp of mobileViewports) {
    test(`Layout metrics check on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/bible');
      
      const metrics = await page.evaluate(() => {
        const header = document.querySelector('header');
        const mainContent = document.getElementById('main-content');
        const bottomNav = document.querySelector('nav[aria-label*="Navegação móvel"]');
        
        return {
          headerHeight: header?.getBoundingClientRect().height || 0,
          contentTop: mainContent?.getBoundingClientRect().top || 0,
          bottomNavHeight: bottomNav?.getBoundingClientRect().height || 0,
          viewportHeight: window.innerHeight
        };
      });

      console.log(`${vp.name} Metrics:`, metrics);
      
      // Premium constraints: Header <= 40px, Bottom Nav <= 52px
      expect(metrics.headerHeight).toBeLessThanOrEqual(40);
      expect(metrics.bottomNavHeight).toBeLessThanOrEqual(52);
      
      // Above the fold: Content should be within top 25% of viewport
      expect(metrics.contentTop).toBeLessThan(metrics.viewportHeight * 0.25);
    });
  }
});
