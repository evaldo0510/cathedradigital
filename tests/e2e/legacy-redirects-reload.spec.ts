/**
 * Redirects legados — reload após redirect
 *
 * Valida que, após seguir um alias legado (ex.: /rezar → /oracao),
 * um page.reload() mantém a página final e não reintroduz o alias.
 *
 * Também valida que, ao recarregar a âncora /buscar com query params,
 * as querystrings sobrevivem ao reload.
 */
import { test, expect } from '@playwright/test';

const SEARCH_QS = '?q=gra%C3%A7a&sort=recent';

const LEGACY_REDIRECTS: Array<[string, string]> = [
  ['/home', '/'],
  ['/biblia', '/bible'],
  ['/catecismo', '/catechism'],
  ['/magisterio', '/magisterium'],
  ['/search', '/buscar'],
  ['/chat', '/logos'],
  ['/login', '/auth'],
  ['/dashboard', '/hoje'],
  ['/glossary', '/glossario'],
  ['/az-faith', '/glossario'],
  ['/encyclopedia', '/glossario'],
  ['/prayers', '/oracao'],
  ['/rezar', '/oracao'],
  ['/contemplacao', '/contemplatio'],
  ['/library', '/biblioteca'],
  ['/prayer', '/oracao'],
  ['/via-crucis', '/viacrucis'],
  ['/journeys', '/jornadas'],
  ['/notes', '/diario'],
  ['/telemetry', '/admin/telemetry'],
  ['/security', '/admin/security'],
  ['/catechism-explorer', '/catechism'],
  ['/formacao', '/jornadas'],
  ['/formar-se', '/jornadas'],
  ['/minha-jornada', '/jornadas'],
  ['/pesquisar', '/buscar'],
  ['/oracoes', '/oracao'],
  ['/orar', '/oracao'],
  ['/rosario', '/rosary'],
  ['/via-sacra', '/viacrucis'],
  ['/today', '/hoje'],
  ['/saints', '/santos'],
  ['/liturgy', '/liturgia'],
];

test.describe('Redirects legados — reload preserva destino final', () => {
  for (const [from, expectedPrefix] of LEGACY_REDIRECTS) {
    test(`reload em ${from} → mantém ${expectedPrefix}`, async ({ page }) => {
      await page.goto(from, { waitUntil: 'domcontentloaded' });
      await page
        .waitForFunction(
          (t) => window.location.pathname.startsWith(t),
          expectedPrefix,
          { timeout: 5000 },
        )
        .catch(() => {});

      const beforeReload = new URL(page.url()).pathname;
      expect(
        beforeReload.startsWith(expectedPrefix),
        `pré-reload: esperava ${expectedPrefix}, chegou em ${beforeReload}`,
      ).toBe(true);

      await page.reload({ waitUntil: 'domcontentloaded' });

      const afterReload = new URL(page.url()).pathname;
      expect(
        afterReload === from,
        `reload trouxe o alias ${from} de volta — URL deveria manter destino`,
      ).toBe(false);
      expect(
        afterReload.startsWith(expectedPrefix),
        `pós-reload: esperava ${expectedPrefix}, chegou em ${afterReload}`,
      ).toBe(true);

      // Sanidade: não caiu em 404.
      const notFound = await page.getByText(/404|não encontrada|not found/i).count();
      expect(notFound, `reload em ${from} caiu em tela 404`).toBe(0);
    });
  }
});

test.describe('Reload em /buscar preserva query params', () => {
  test(`reload em /buscar${SEARCH_QS} mantém q e sort`, async ({ page }) => {
    await page.goto(`/buscar${SEARCH_QS}`, { waitUntil: 'domcontentloaded' });
    await page.reload({ waitUntil: 'domcontentloaded' });

    const url = new URL(page.url());
    expect(url.pathname).toBe('/buscar');
    expect(url.searchParams.get('q')).toBe('graça');
    expect(url.searchParams.get('sort')).toBe('recent');
  });
});
