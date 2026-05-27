import { test, expect } from '@playwright/test';

const ROUTES = ['/', '/encyclopedia', '/bible', '/search'];

test.describe('Link and Redirect Audit', () => {
  for (const route of ROUTES) {
    test(`Audit links on ${route}`, async ({ page }) => {
      console.log(`Auditing links for: ${route}`);
      await page.goto(route);
      
      // Wait for content to load
      await page.waitForLoadState('networkidle');

      const links = await page.locator('a').all();
      const results: { url: string, status: number, error?: string, isRedirect: boolean }[] = [];

      for (const link of links) {
        const href = await link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;

        // Resolve relative URLs
        const targetUrl = new URL(href, page.url()).href;

        try {
          const response = await page.request.get(targetUrl, {
            // We want to manually check redirects if possible, but request.get follows them by default.
            // Playwright's request.get status will be the final status after redirects.
            maxRedirects: 5
          });

          const status = response.status();
          const urlAfterRedirects = response.url();
          const isRedirect = targetUrl !== urlAfterRedirects;

          results.push({
            url: targetUrl,
            status,
            isRedirect
          });

          // CRITICAL ERRORS: 404, 500, etc.
          if (status >= 400) {
            console.error(`CRITICAL: Broken link found on ${route}: ${targetUrl} (Status: ${status})`);
            // We fail the test if a critical broken link is found
            expect(status, `Broken link detected: ${targetUrl} on ${route}`).toBeLessThan(400);
          }

          // WARNINGS: Redirects (could be 301/302)
          if (isRedirect) {
            console.warn(`WARNING: Redirect detected on ${route}: ${targetUrl} -> ${urlAfterRedirects}`);
          }

        } catch (error) {
          console.error(`CRITICAL: Failed to fetch link on ${route}: ${targetUrl} - ${error.message}`);
          results.push({
            url: targetUrl,
            status: 0,
            error: error.message,
            isRedirect: false
          });
          // Network errors are also critical
          expect(true, `Network error for link ${targetUrl} on ${route}: ${error.message}`).toBe(false);
        }
      }

      console.log(`Finished auditing ${links.length} links on ${route}`);
    });
  }
});
