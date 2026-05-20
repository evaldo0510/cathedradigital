import { test, expect } from '@playwright/test';

const OFFICIAL_DOMAIN = 'https://www.cathedradigital.com.br';

test.describe('SEO, Sitemap and Robots Delivery', () => {
  test('should serve sitemap.xml with correct headers and content', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    
    // Check if sitemap is served
    expect(response.ok()).toBeTruthy();
    
    // Check headers
    const contentType = response.headers()['content-type'];
    expect(contentType).toMatch(/xml/);
    
    const cacheControl = response.headers()['cache-control'];
    // Expect some caching, e.g., max-age=3600 or public
    expect(cacheControl).toBeDefined();
    
    const text = await response.text();
    
    // Check for essential URLs and tags
    expect(text).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(text).toContain(OFFICIAL_DOMAIN);
    expect(text).toContain('/hoje');
    expect(text).toContain('/bible');
    expect(text).toContain('/catechism');
    expect(text).toContain('<changefreq>daily</changefreq>');
    expect(text).toContain('<priority>1.0</priority>');
    
    // Ensure no admin routes are present
    expect(text).not.toContain('/admin');
    expect(text).not.toContain('/login');
  });

  test('should serve robots.txt with sitemap and dynamic disallows', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.ok()).toBeTruthy();
    
    const contentType = response.headers()['content-type'];
    expect(contentType).toMatch(/text\/plain/);
    
    const cacheControl = response.headers()['cache-control'];
    expect(cacheControl).toBeDefined();
    
    const text = await response.text();
    expect(text).toContain(`Sitemap: ${OFFICIAL_DOMAIN}/sitemap.xml`);
    expect(text).toContain('Disallow: /admin');
    expect(text).toContain('Disallow: /checkout');
    expect(text).toContain('Disallow: /profile');
  });

  test('should have correct canonical tags on main public pages', async ({ page }) => {
    const publicPages = [
      '/',
      '/hoje',
      '/bible',
      '/catechism',
      '/about',
      '/guia-modulos'
    ];

    for (const path of publicPages) {
      await page.goto(path);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toBe(`${OFFICIAL_DOMAIN}${path === '/' ? '' : path}`);
    }
  });

  test('should have correct canonical tags on representative dynamic routes', async ({ page }) => {
    const dynamicRoutes = [
      { path: '/santos/santo-antonio', expected: '/santos/santo-antonio' },
      { path: '/magisterium/dei-verbum', expected: '/magisterium/dei-verbum' },
      { path: '/temas/fe-e-razao', expected: '/temas/fe-e-razao' }
    ];

    for (const route of dynamicRoutes) {
      await page.goto(route.path);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toBe(`${OFFICIAL_DOMAIN}${route.expected}`);
    }
  });
});

