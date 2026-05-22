import { test, expect } from '@playwright/test';

/**
 * Sitemap & Robots.txt Delivery and Integrity Test
 */
test.describe('Search Infrastructure - Sitemap & Robots', () => {
  
  test('robots.txt should exist and be indexable', async ({ page }) => {
    const response = await page.goto('/robots.txt');
    expect(response?.status()).toBe(200);
    
    const body = await response?.text();
    expect(body).toContain('User-agent: *');
    expect(body).toContain('Sitemap:');
    
    // Check if sitemap URL in robots.txt matches project URL
    const sitemapUrl = body?.match(/Sitemap:\s*(.*)/)?.[1];
    expect(sitemapUrl).toBeTruthy();
    console.log(`Verified Sitemap URL in robots.txt: ${sitemapUrl}`);
  });

  test('sitemap.xml should exist and contain main routes', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    expect(response?.status()).toBe(200);
    
    const body = await response?.text();
    expect(body).toContain('<urlset');
    
    // Verify main pages are present (updated to Portuguese routes)
    const criticalUrls = [
      '/',
      '/biblia',
      '/catecismo',
      '/magisterio'
    ];
    
    for (const url of criticalUrls) {
      // Basic check for presence
      expect(body, `Sitemap missing critical URL: ${url}`).toContain(url);
    }
    
    console.log('Verified critical URLs in sitemap.xml');
  });

  test('Verify sitemap points to valid pages', async ({ page }) => {
    // Navigate to a few links from the sitemap to ensure they aren't 404
    const response = await page.goto('/sitemap.xml');
    const body = await response?.text() || '';
    
    // Extract locs
    const locs = (body.match(/<loc>(.*?)<\/loc>/g) || [])
      .slice(0, 3) // Sample 3
      .map(l => l.replace(/<\/?loc>/g, ''));
    
    for (const loc of locs) {
      // Use request.get for faster status checking
      const pageResponse = await page.request.get(loc);
      // It might be a redirect or 200, but should not be 404/500
      expect(pageResponse.status(), `Sitemap points to a broken link: ${loc}`).toBeLessThan(400);
    }
  });
});
