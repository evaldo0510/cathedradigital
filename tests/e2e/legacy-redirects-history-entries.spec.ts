/**
 * Redirects legados — contagem de entradas no history
 *
 * Contrato: como todos os aliases legados usam <Navigate replace />,
 * o alias NÃO cria uma entrada nova no history. A sequência
 *   âncora → alias(→ destino) → âncora2
 * deve produzir exatamente 3 entradas visíveis (âncora, destino, âncora2),
 * nunca 4 (que indicaria o alias ainda no histórico).
 *
 * Também valida que goBack/goForward alternam entre as URLs esperadas,
 * sem re-abrir o alias legado.
 */
import { test, expect } from '@playwright/test';

const ANCHOR_A = '/buscar';
const ANCHOR_B = '/biblioteca';

const LEGACY_REDIRECTS: Array<[string, string]> = [
  ['/rezar', '/oracao'],
  ['/biblia', '/bible'],
  ['/catecismo', '/catechism'],
  ['/prayers', '/oracao'],
  ['/library', '/biblioteca'],
  ['/journeys', '/jornadas'],
  ['/rosario', '/rosary'],
  ['/via-sacra', '/viacrucis'],
  ['/today', '/hoje'],
  ['/saints', '/santos'],
  ['/liturgy', '/liturgia'],
  ['/glossary', '/glossario'],
  ['/prayer', '/oracao'],
  ['/notes', '/diario'],
  ['/formacao', '/jornadas'],
  ['/pesquisar', '/buscar'],
];

test.describe('Redirects legados — history.length e alternância goBack/goForward', () => {
  for (const [from, expectedPrefix] of LEGACY_REDIRECTS) {
    if (expectedPrefix === ANCHOR_A || expectedPrefix === ANCHOR_B) continue;
    if (from === ANCHOR_A || from === ANCHOR_B) continue;

    test(`history não duplica entrada para ${from} → ${expectedPrefix}`, async ({ page }) => {
      // 1. Âncora A — reset do histórico ao mínimo controlável.
      await page.goto(ANCHOR_A, { waitUntil: 'domcontentloaded' });
      const startLen = await page.evaluate(() => window.history.length);

      // 2. Alias legado (aplica <Navigate replace>).
      await page.goto(from, { waitUntil: 'domcontentloaded' });
      await page
        .waitForFunction(
          (t) => window.location.pathname.startsWith(t),
          expectedPrefix,
          { timeout: 5000 },
        )
        .catch(() => {});

      const afterRedirectPath = new URL(page.url()).pathname;
      expect(afterRedirectPath.startsWith(expectedPrefix)).toBe(true);

      const afterRedirectLen = await page.evaluate(() => window.history.length);
      // Com <Navigate replace>, o alias NÃO acrescenta uma entrada extra
      // além da nova navegação para o destino.
      // startLen + 1 é o esperado; startLen + 2 indica que o alias ficou no history.
      expect(
        afterRedirectLen - startLen,
        `esperado +1 entrada (destino apenas); alias ${from} adicionou ${afterRedirectLen - startLen}`,
      ).toBeLessThanOrEqual(1);

      // 3. Segunda âncora — adiciona +1 entrada real.
      await page.goto(ANCHOR_B, { waitUntil: 'domcontentloaded' });

      // 4. goBack → destino do redirect, NUNCA o alias.
      await page.goBack({ waitUntil: 'domcontentloaded' });
      const backPath1 = new URL(page.url()).pathname;
      expect(backPath1, `back após ${ANCHOR_B} deveria abrir ${expectedPrefix}`).toMatch(
        new RegExp('^' + expectedPrefix),
      );
      expect(backPath1, 'back reabriu o alias legado').not.toBe(from);

      // 5. goBack novamente → âncora A original.
      await page.goBack({ waitUntil: 'domcontentloaded' });
      const backPath2 = new URL(page.url()).pathname;
      expect(backPath2, `segundo back deveria voltar a ${ANCHOR_A}`).toMatch(
        new RegExp('^' + ANCHOR_A),
      );

      // 6. goForward → destino do redirect (não o alias).
      await page.goForward({ waitUntil: 'domcontentloaded' });
      const fwdPath1 = new URL(page.url()).pathname;
      expect(fwdPath1).toMatch(new RegExp('^' + expectedPrefix));
      expect(fwdPath1, 'forward reabriu o alias legado').not.toBe(from);

      // 7. goForward → âncora B.
      await page.goForward({ waitUntil: 'domcontentloaded' });
      const fwdPath2 = new URL(page.url()).pathname;
      expect(fwdPath2).toMatch(new RegExp('^' + ANCHOR_B));
    });
  }
});
