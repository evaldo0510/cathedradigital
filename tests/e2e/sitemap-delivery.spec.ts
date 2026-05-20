import { test, expect } from '@playwright/test';

test.describe('SEO and Sitemap Delivery', () => {
  test('should serve sitemap.xml with correct content type and URLs', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    
    // Check if sitemap is served
    expect(response.ok()).toBeTruthy();
    
    const contentType = response.headers()['content-type'];
    expect(contentType).toMatch(/xml/);
    
    const text = await response.text();
    
    // Check for essential URLs and tags
    expect(text).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(text).toContain('https://www.cathedradigital.com.br');
    expect(text).toContain('/hoje');
    expect(text).toContain('/bible');
    expect(text).toContain('/catechism');
    expect(text).toContain('<changefreq>daily</changefreq>');
    expect(text).toContain('<priority>1.0</priority>');
    
    // Ensure no admin routes are present
    expect(text).not.toContain('/admin');
    expect(text).not.toContain('/login');
  });

  test('should serve robots.txt with sitemap and private disallows', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.ok()).toBeTruthy();
    
    const text = await response.text();
    expect(text).toContain('Sitemap: https://www.cathedradigital.com.br/sitemap.xml');
    expect(text).toContain('Disallow: /admin');
    expect(text).toContain('Disallow: /checkout');
    expect(text).toContain('Disallow: /profile');
  });

  test('should have correct canonical tag pointing to official domain', async ({ page }) => {
    await page.goto('/');
    const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
    expect(canonical).toBe('https://www.cathedradigital.com.br/');

    await page.goto('/about');
    const canonicalAbout = await page.getAttribute('link[rel="canonical"]', 'href');
    expect(canonicalAbout).toBe('https://www.cathedradigital.com.br/about');
  });
});
