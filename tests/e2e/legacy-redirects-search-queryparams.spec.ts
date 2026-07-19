/**
 * Redirects legados — preservação de query params e foco ao voltar
 *
 * Cenário: usuário está em /buscar com filtros (?q=graça&sort=recent),
 * clica num link que abre um alias legado. Ao voltar (goBack), a página
 * de busca deve reabrir com os MESMOS query params e o campo de busca
 * deve receber foco (ou permanecer focável sem ter perdido estado).
 *
 * Este spec valida contra regressões em ScrollToTop / router config que
 * possam limpar a query string ao voltar.
 */
import { test, expect, type Page } from '@playwright/test';

const SEARCH_QS = '?q=gra%C3%A7a&sort=recent';
const ANCHOR = `/buscar${SEARCH_QS}`;

const LEGACY_REDIRECTS: Array<[string, string]> = [
  ['/rezar', '/oracao'],
  ['/biblia', '/bible'],
  ['/catecismo', '/catechism'],
  ['/library', '/biblioteca'],
  ['/rosario', '/rosary'],
  ['/saints', '/santos'],
  ['/glossary', '/glossario'],
];

async function findSearchInput(page: Page) {
  // Tenta seletores estáveis, do mais específico ao genérico.
  const candidates = [
    page.getByRole('searchbox'),
    page.getByRole('textbox', { name: /buscar|pesquisar|search/i }),
    page.locator('input[type="search"]'),
    page.locator('input[name="q"]'),
    page.locator('input[placeholder*="uscar" i]'),
    page.locator('input[placeholder*="esquis" i]'),
  ];
  for (const c of candidates) {
    if (await c.first().count()) return c.first();
  }
  return null;
}

test.describe('Redirects legados — goBack preserva query params de /buscar', () => {
  for (const [from, expectedPrefix] of LEGACY_REDIRECTS) {
    test(`back de ${from} → mantém ${SEARCH_QS} em /buscar`, async ({ page }) => {
      // 1. Âncora com query params.
      await page.goto(ANCHOR, { waitUntil: 'domcontentloaded' });
      const before = new URL(page.url());
      expect(before.pathname).toBe('/buscar');
      expect(before.searchParams.get('q')).toBe('graça');
      expect(before.searchParams.get('sort')).toBe('recent');

      // 2. Alias legado.
      await page.goto(from, { waitUntil: 'domcontentloaded' });
      await page
        .waitForFunction(
          (t) => window.location.pathname.startsWith(t),
          expectedPrefix,
          { timeout: 5000 },
        )
        .catch(() => {});
      expect(new URL(page.url()).pathname.startsWith(expectedPrefix)).toBe(true);

      // 3. Voltar — query params devem ser restauradas.
      await page.goBack({ waitUntil: 'domcontentloaded' });
      const after = new URL(page.url());
      expect(after.pathname, 'back não retornou a /buscar').toBe('/buscar');
      expect(
        after.searchParams.get('q'),
        'query param q foi perdida no goBack',
      ).toBe('graça');
      expect(
        after.searchParams.get('sort'),
        'query param sort foi perdida no goBack',
      ).toBe('recent');

      // 4. Campo de busca continua presente e focável (não perdeu montagem).
      const searchInput = await findSearchInput(page);
      if (searchInput) {
        await expect(searchInput, 'input de busca deveria estar visível após back').toBeVisible({
          timeout: 5000,
        });
        // Foco não é garantido nativamente pelo browser após back — validamos
        // que é possível focar sem erro (o campo existe e está habilitado).
        await searchInput.focus();
        const isFocused = await searchInput.evaluate((el) => el === document.activeElement);
        expect(isFocused, 'campo de busca não recebeu foco após back').toBe(true);
      }
    });
  }
});
