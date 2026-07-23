import { test, expect } from '@playwright/test';

/**
 * sitemap.xml não pode expor /planos (nem variações). Toda URL cujo path
 * mencione "planos" deve, na prática, ser /pricing.
 */
test.describe('sitemap.xml — sem /planos', () => {
  test('nenhuma <loc> referencia /planos', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    const xml = await res.text();

    const locs = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1].trim());
    expect(locs.length, 'sitemap vazio').toBeGreaterThan(0);

    const planosLocs = locs.filter((u) => {
      try {
        return new URL(u).pathname.startsWith('/planos');
      } catch {
        return u.includes('/planos');
      }
    });
    expect(planosLocs, `sitemap contém /planos: ${planosLocs.join(', ')}`).toEqual([]);

    const pricingLocs = locs.filter((u) => {
      try {
        return new URL(u).pathname === '/pricing';
      } catch {
        return u.endsWith('/pricing');
      }
    });
    expect(pricingLocs.length, 'sitemap não expõe /pricing (destino canônico)').toBeGreaterThan(0);
  });
});
