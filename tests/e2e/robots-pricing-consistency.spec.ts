import { test, expect } from '@playwright/test';

/**
 * robots.txt vs meta robots de /pricing e canonical devem ser coerentes:
 * - /planos consta em Disallow
 * - /pricing NÃO consta em Disallow
 * - /pricing meta robots não contém noindex
 * - canonical de /pricing termina em /pricing
 */
test.describe('robots.txt ↔ /pricing coerência', () => {
  test('regras alinhadas entre robots, meta e canonical', async ({ page, request }) => {
    const robotsRes = await request.get('/robots.txt');
    expect(robotsRes.status()).toBe(200);
    const robots = await robotsRes.text();

    const disallows = robots
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.toLowerCase().startsWith('disallow:'))
      .map((l) => l.split(':')[1].trim());

    expect(disallows, 'robots.txt deve conter Disallow: /planos').toContain('/planos');
    expect(disallows, 'robots.txt não pode conter Disallow: /pricing').not.toContain('/pricing');

    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    const meta = (await page.getAttribute('meta[name="robots"]', 'content')) ?? 'index,follow';
    expect(meta.toLowerCase(), 'meta robots de /pricing conflita com robots.txt').not.toContain('noindex');

    const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
    expect(canonical, 'canonical ausente em /pricing').toBeTruthy();
    expect(canonical!.endsWith('/pricing')).toBeTruthy();
    expect(canonical!).not.toContain('/planos');
  });
});
