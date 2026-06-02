import { test, expect } from '@playwright/test';

const MOBILE_TARGETS = [
  { name: 'iPhone-SE', width: 375, height: 667 },
  { name: 'iPhone-14', width: 390, height: 844 },
  { name: 'Pixel-7', width: 412, height: 915 },
];

const PAGES_TO_TEST = [
  { path: '/', name: 'home' },
  { path: '/bible', name: 'bible' },
  { path: '/catechism', name: 'catechism' },
];

test.describe('Above the Fold Visual Regression (Multi-target)', () => {
  for (const viewport of MOBILE_TARGETS) {
    for (const pageInfo of PAGES_TO_TEST) {
      test(`Above the fold visual on ${viewport.name} - ${pageInfo.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        // Inject stabilization CSS
        await page.addInitScript(() => {
          const style = document.createElement('style');
          style.innerHTML = `
            *, *::before, *::after {
              animation: none !important;
              transition: none !important;
              animation-duration: 0s !important;
              animation-delay: 0s !important;
            }
            [data-testid="ritual-content"], 
            [data-testid="reading-progress"],
            .ritual-date-text,
            .dynamic-date,
            [data-testid="user-name"] {
               visibility: hidden !important;
            }
            ::-webkit-scrollbar { display: none; }
          `;
          document.head.appendChild(style);
        });

        await page.goto(pageInfo.path);
        await page.waitForLoadState('networkidle');
        await page.evaluate(() => document.fonts.ready);

        // Verify content is actually above the fold numerically before screenshot
        const contentTop = await page.evaluate(() => {
          const mainContent = document.getElementById('main-content');
          return mainContent?.getBoundingClientRect().top || 0;
        });

        // Fail if content is pushed down (Constraint: Content must start within top 15% of viewport height)
        expect(contentTop).toBeLessThan(viewport.height * 0.15);

        // Screenshot ONLY the above-the-fold area (fullPage: false)
        await expect(page).toHaveScreenshot(`${pageInfo.name}-${viewport.name}-fold.png`, {
          fullPage: false,
          maxDiffPixelRatio: 0.01,
          animations: 'disabled',
        });
      });
    }
  }
});
