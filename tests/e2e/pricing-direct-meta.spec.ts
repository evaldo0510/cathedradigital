import { test, expect } from '@playwright/test';

/**
 * /pricing acessado diretamente: canonical self, robots index,follow
 * e nenhum campo referenciando /planos.
 */
test.describe('/pricing direto', () => {
  test('canonical + robots corretos e sem menções a /planos', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    expect(new URL(page.url()).pathname).toBe('/pricing');

    const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
    expect(canonical, 'canonical ausente').toBeTruthy();
    expect(canonical!).toContain('/pricing');
    expect(canonical!).not.toContain('/planos');

    const robots = (await page.getAttribute('meta[name="robots"]', 'content')) ?? 'index,follow';
    const lower = robots.toLowerCase();
    expect(lower).not.toContain('noindex');
    expect(lower).not.toContain('nofollow');
    expect(lower).toMatch(/index/);
    expect(lower).toMatch(/follow/);

    // Nenhuma meta relevante pode conter /planos.
    const metaContents = await page.$$eval(
      'head meta[content], head link[href]',
      (nodes) =>
        nodes.map((n) => n.getAttribute('content') ?? n.getAttribute('href') ?? ''),
    );
    for (const c of metaContents) {
      expect(c, `campo <head> referencia /planos: ${c}`).not.toContain('/planos');
    }

    const jsonLdBlocks = await page.locator('head script[type="application/ld+json"]').allTextContents();
    for (const raw of jsonLdBlocks) {
      expect(raw).not.toContain('/planos');
    }
  });
});
