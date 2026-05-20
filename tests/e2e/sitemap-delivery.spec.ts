import { test, expect } from '@playwright/test';

test.describe('Sitemap Delivery', () => {
  test('should serve sitemap.xml with correct content type and URLs', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    
    // Check if sitemap is served
    expect(response.ok()).toBeTruthy();
    
    const contentType = response.headers()['content-type'];
    expect(contentType).toMatch(/xml/);
    
    const text = await response.text();
    
    // Check for essential URLs
    expect(text).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(text).toContain('https://www.cathedradigital.com.br');
    expect(text).toContain('/hoje');
    expect(text).toContain('/bible');
    expect(text).toContain('/catechism');
    
    // Ensure no admin routes are present
    expect(text).not.toContain('/admin');
    expect(text).not.toContain('/login');
  });
});
