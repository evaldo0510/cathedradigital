import { test, expect, Page } from '@playwright/test';

/**
 * Varre landing pública (/) e coleta todos os CTAs/links do header e hero
 * cujo href alvo poderia levar a /planos ou /pricing. Clica em cada um e
 * confirma que o destino final é /pricing (nunca /planos) sem loops de
 * redirecionamento.
 */

const TARGET_SELECTORS = [
  'header a[href$="/planos"]',
  'header a[href$="/pricing"]',
  '[data-testid="hero"] a[href$="/planos"]',
  '[data-testid="hero"] a[href$="/pricing"]',
  'section:first-of-type a[href$="/planos"]',
  'section:first-of-type a[href$="/pricing"]',
].join(', ');

async function collectTargetHrefs(page: Page): Promise<string[]> {
  return page.$$eval(TARGET_SELECTORS, (nodes) =>
    Array.from(new Set(nodes.map((n) => (n as HTMLAnchorElement).getAttribute('href') ?? ''))).filter(Boolean),
  );
}

test.describe('CTAs do header/hero → /pricing (sem loop)', () => {
  test('todos os anchors alvo terminam em /pricing', async ({ page }) => {
    const redirectCount = { n: 0 };
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) redirectCount.n += 1;
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const hrefs = await collectTargetHrefs(page);
    expect(hrefs.length, 'nenhum CTA para /planos ou /pricing encontrado no header/hero').toBeGreaterThan(0);

    for (const href of hrefs) {
      redirectCount.n = 0;
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const link = page.locator(`a[href="${href}"]`).first();
      await expect(link, `link ${href} não visível`).toBeVisible();
      await link.click();

      await page.waitForURL('**/pricing', { timeout: 10_000 });
      expect(new URL(page.url()).pathname, `href ${href} não terminou em /pricing`).toBe('/pricing');

      // Guard contra loop: no máximo home → alias → pricing (≤ 3 navegações).
      expect(redirectCount.n, `redirect loop detectado a partir de ${href}`).toBeLessThanOrEqual(4);

      const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
      expect(canonical).toContain('/pricing');
      expect(canonical).not.toContain('/planos');
    }
  });
});
