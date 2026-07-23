import { test, expect } from '@playwright/test';

/**
 * O redirect /planos → /pricing deve preservar toda a query string
 * (UTM, refs, campanhas). O destino final não pode entrar em loop nem
 * perder parâmetros — SEM referências a /planos no HTML final.
 */
const CASES = [
  '?utm_source=google&utm_campaign=lent2026',
  '?ref=parceiro&utm_medium=cpc',
  '?utm_source=x&utm_content=hero-cta&utm_term=planos',
  '?fbclid=IwAR_fake_id_123',
];

test.describe('/planos preserva query string', () => {
  for (const qs of CASES) {
    test(`redireciona para /pricing preservando "${qs}"`, async ({ page }) => {
      const responses: string[] = [];
      page.on('framenavigated', (f) => {
        if (f === page.mainFrame()) responses.push(f.url());
      });

      await page.goto(`/planos${qs}`);
      await page.waitForURL('**/pricing**');
      await page.waitForLoadState('networkidle');

      const finalUrl = new URL(page.url());
      expect(finalUrl.pathname).toBe('/pricing');

      // Query string preservada — todos os pares originais precisam estar presentes.
      const expected = new URLSearchParams(qs.slice(1));
      for (const [k, v] of expected.entries()) {
        expect(
          finalUrl.searchParams.get(k),
          `query param ${k} não foi preservado ao redirecionar /planos → /pricing`,
        ).toBe(v);
      }

      // Não pode ter loop: no máximo 1 hop de /planos para /pricing.
      const planosHops = responses.filter((u) => new URL(u).pathname.startsWith('/planos'));
      expect(planosHops.length, `loop suspeito em /planos: ${responses.join(' → ')}`).toBeLessThanOrEqual(1);

      // Canonical continua limpo (sem /planos).
      const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
      expect(canonical, 'canonical ausente').toBeTruthy();
      expect(canonical!).toContain('/pricing');
      expect(canonical!).not.toContain('/planos');
    });
  }
});
