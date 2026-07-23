import { test, expect } from '@playwright/test';

/**
 * Simula Googlebot acessando /planos: canonical deve apontar /pricing,
 * JSON-LD não pode referenciar /planos e não pode haver loop de redirect.
 */
const GOOGLEBOT_UA =
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

test.use({ userAgent: GOOGLEBOT_UA });

test.describe('Googlebot → /planos', () => {
  test('resolve em /pricing sem loop e sem referências a /planos', async ({ page }) => {
    const navCount = { n: 0 };
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) navCount.n += 1;
    });

    await page.goto('/planos');
    await page.waitForURL('**/pricing');
    await page.waitForLoadState('networkidle');

    expect(new URL(page.url()).pathname).toBe('/pricing');
    expect(navCount.n, 'loop de redirect detectado para Googlebot').toBeLessThanOrEqual(4);

    const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
    expect(canonical).toContain('/pricing');
    expect(canonical).not.toContain('/planos');

    const robots = await page.getAttribute('meta[name="robots"]', 'content');
    if (robots) expect(robots.toLowerCase()).not.toContain('noindex');

    const jsonLdBlocks = await page.locator('head script[type="application/ld+json"]').allTextContents();
    for (const raw of jsonLdBlocks) {
      expect(raw, 'JSON-LD referencia /planos para Googlebot').not.toContain('/planos');
      expect(() => JSON.parse(raw)).not.toThrow();
    }
  });
});
