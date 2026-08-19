import { test, expect } from '@playwright/test';

test.describe('SEO and Heading Regression', () => {
  const routes = [
    '/',
    '/ler',
    '/orar',
    '/igreja',
    '/biblioteca',
    '/santos',
    '/catecismo',
    '/biblia',
    '/admin/diagnostics',
  ];

  for (const route of routes) {
    test(`Verify headings and meta tags on ${route}`, async ({ page }) => {
      await page.goto(route);
      
      // Wait for content to load
      await page.waitForLoadState('domcontentloaded');

      // 1. Verify H1 (Must have exactly one)
      const h1Count = await page.locator('h1').count();
      expect(h1Count, `Route ${route} should have exactly one H1, but found ${h1Count}`).toBe(1);

      // 2. Verify Heading Hierarchy (No skips)
      const headings = await page.evaluate(() => {
        const tags = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        return tags.map(t => parseInt(t.tagName.substring(1)));
      });

      for (let i = 0; i < headings.length - 1; i++) {
        const current = headings[i];
        const next = headings[i + 1];
        if (next > current) {
          expect(next - current, `Heading skip detected on ${route}: H${current} followed by H${next}`).toBeLessThanOrEqual(1);
        }
      }

      // 3. Verify Critical Meta Tags
      const title = await page.title();
      expect(title.length).toBeGreaterThan(10); // Ensure title is not default/empty

      const description = await page.locator('meta[name="description"]').getAttribute('content');
      expect(description?.length).toBeGreaterThan(50);

      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
      expect(ogTitle).toBeTruthy();

      const ogDesc = await page.locator('meta[property="og:description"]').getAttribute('content');
      expect(ogDesc).toBeTruthy();
    });
  }
});
