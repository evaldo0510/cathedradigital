import { test, expect } from '@playwright/test';

/**
 * Varre variações de /planos (trailing slash, query, hash, caixa) e
 * confirma que todas resolvem em /pricing, sem loop, com canonical certo.
 */
const ALIASES = [
  '/planos',
  '/planos/',
  '/planos?utm_source=test',
  '/planos?ref=footer&x=1',
  '/planos#top',
  '/planos/?utm_medium=email',
];

test.describe('Aliases de /planos → /pricing', () => {
  for (const alias of ALIASES) {
    test(`${alias} resolve em /pricing sem loop`, async ({ page }) => {
      const navCount = { n: 0 };
      page.on('framenavigated', (frame) => {
        if (frame === page.mainFrame()) navCount.n += 1;
      });

      await page.goto(alias);
      await page.waitForURL('**/pricing**', { timeout: 10_000 });
      await page.waitForLoadState('networkidle');

      expect(new URL(page.url()).pathname).toBe('/pricing');
      expect(navCount.n, `loop de redirect em ${alias}`).toBeLessThanOrEqual(4);

      const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
      expect(canonical, `canonical ausente após ${alias}`).toBeTruthy();
      expect(canonical!).toContain('/pricing');
      expect(canonical!).not.toContain('/planos');
    });
  }
});
