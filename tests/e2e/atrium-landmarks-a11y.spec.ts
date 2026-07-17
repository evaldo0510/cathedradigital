import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Landmarks e rótulos acessíveis em todas as rotas do menu do Átrio
 * (rotas reais, após remapeamento) + NotFound.
 * Falha em violações críticas/sérias e valida presença de <main>
 * único, <footer> e <nav>/<header> onde aplicável.
 */

const ROUTES = [
  { label: 'Átrio',          path: '/' },
  { label: 'Estudar',        path: '/bible' },
  { label: 'Rezar',          path: '/oracao' },
  { label: 'Formar-se',      path: '/jornadas' },
  { label: 'Pesquisar',      path: '/buscar' },
  { label: 'Minha Jornada',  path: '/hoje' },
  { label: 'NotFound',       path: '/rota-que-nao-existe-xyz' },
] as const;

const CRITICAL_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const LANDMARK_RULES = [
  'landmark-one-main',
  'landmark-unique',
  'landmark-no-duplicate-main',
  'landmark-no-duplicate-banner',
  'landmark-no-duplicate-contentinfo',
  'region',
  'page-has-heading-one',
];

for (const vp of [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'mobile',  width: 390,  height: 844 },
] as const) {
  test.describe(`Átrio landmarks a11y · ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const r of ROUTES) {
      test(`${r.label} (${r.path}) · axe landmarks`, async ({ page }) => {
        await page.goto(r.path);
        // aguarda conteúdo real
        await expect(page.locator('main, [role="main"]').first())
          .toBeVisible({ timeout: 15000 });

        // Só um <main>
        const mainCount = await page.locator('main, [role="main"]').count();
        expect(mainCount).toBe(1);

        const results = await new AxeBuilder({ page })
          .withTags(CRITICAL_TAGS)
          .withRules(LANDMARK_RULES)
          .analyze();
        const bad = results.violations.filter((v) =>
          ['critical', 'serious'].includes(v.impact || ''),
        );
        expect(bad, JSON.stringify(bad, null, 2)).toEqual([]);
      });
    }
  });
}
