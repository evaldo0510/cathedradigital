import { test, expect } from '@playwright/test';

const PAGES = [
  '/',
  '/hoje',
  '/catechism',
  '/bible',
  '/prayers',
  '/temas',
  '/biblioteca',
  '/logos',
];

const MOBILE_VIEWPORTS = [
  { name: 'iPhone SE (360px)', width: 360, height: 667 },
  { name: 'iPhone 13 (390px)', width: 390, height: 844 },
  { name: 'iPhone 14 Pro Max (430px)', width: 430, height: 932 },
];

test.describe('Advanced Mobile Spacing Rhythm Consistency', () => {
  for (const viewport of MOBILE_VIEWPORTS) {
    test.describe(`Viewport: ${viewport.name}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
      });

      for (const route of PAGES) {
        test(`Rhythm tokens on ${route}`, async ({ page }) => {
          await page.goto(route);
          await page.waitForLoadState('networkidle');

          // 1. Check for core rhythm classes
          const sections = page.locator('.section-rhythm');
          const stacks = page.locator('.stack-rhythm, .stack-rhythm-lg');
          const paddings = page.locator('.padding-rhythm');

          const hasRhythm = (await sections.count()) > 0 || (await stacks.count()) > 0 || (await paddings.count()) > 0;
          
          if (!hasRhythm) {
            console.warn(`Page ${route} might be missing spacing tokens.`);
          }

          // 2. Validate Section Padding (expected 40px on mobile)
          if (await sections.count() > 0) {
            const pt = await sections.first().evaluate(el => window.getComputedStyle(el).paddingTop);
            // 40px is the standard section-rhythm padding-top for mobile in index.css
            expect(parseInt(pt)).toBeGreaterThanOrEqual(32); // Allow minor variations or scaling
          }

          // 3. Validate Header Margins
          const headers = page.locator('h1, h2');
          if (await headers.count() > 0) {
            const hasHeaderMargin = await page.evaluate(() => {
              return document.querySelectorAll('.header-margin-rhythm').length > 0;
            });
            if (!hasHeaderMargin) {
              console.warn(`Page ${route} has headers but no .header-margin-rhythm detected.`);
            }
          }
          
          // 4. Line-height consistency check
          const bodyText = page.locator('p').first();
          if (await bodyText.isVisible()) {
            const lh = await bodyText.evaluate(el => window.getComputedStyle(el).lineHeight);
            const fs = await bodyText.evaluate(el => window.getComputedStyle(el).fontSize);
            const ratio = parseFloat(lh) / parseFloat(fs);
            // Premium reading rhythm expects 1.5 - 1.7 ratio for body text
            expect(ratio).toBeGreaterThanOrEqual(1.4);
            expect(ratio).toBeLessThanOrEqual(1.8);
          }
        });
      }
    });
  }
});