import { test, expect } from '@playwright/test';

const ROUTES = [
  '/',
  '/biblioteca',
  '/comunidade',
  '/jornadas',
  '/perfil',
  '/admin/diagnostics',
  '/admin/seo',
  '/admin/security-docs'
];

test.describe('SEO & Hierarchy Regression Tests', () => {
  for (const route of ROUTES) {
    test(`Check heading hierarchy and metadata for ${route}`, async ({ page }) => {
      await page.goto(route);
      
      // 1. Check for single H1
      const h1s = page.locator('h1');
      await expect(h1s).toHaveCount(1, { message: `Route ${route} must have exactly one H1` });
      
      // 2. Check for heading jumps (H1 -> H3 without H2)
      const headings = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        return elements.map(el => parseInt(el.tagName.substring(1)));
      });

      for (let i = 0; i < headings.length - 1; i++) {
        const current = headings[i];
        const next = headings[i + 1];
        if (next > current + 1) {
          throw new Error(`Heading jump detected at ${route}: H${current} followed by H${next}`);
        }
      }

      // 3. Check for meta tags
      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);
      
      const description = await page.locator('meta[name="description"]').getAttribute('content');
      expect(description?.length).toBeGreaterThan(0);
      
      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
      expect(ogTitle?.length).toBeGreaterThan(0);
    });
  }
});
