/**
 * Redirects legados — botão Voltar do navegador
 *
 * Como os redirects legados são feitos via <Navigate replace> do React Router,
 * a entrada original (ex.: /rezar) NÃO deve ficar no histórico. Ao clicar em
 * "Voltar" após um redirect, o usuário precisa retornar para a página anterior
 * (âncora), e não ficar preso em loop /rezar ⇄ /oracao.
 *
 * Este spec:
 *   1. Navega para uma âncora estável (/) e confirma.
 *   2. Navega para o alias legado (ex.: /rezar) — que redireciona.
 *   3. Confirma que o pathname final é o destino esperado (ex.: /oracao).
 *   4. Clica em page.goBack() e confirma que voltou para a âncora,
 *      não para o alias legado (sem loop).
 *   5. Confirma que o pathname não é mais o destino do redirect.
 */
import { test, expect } from '@playwright/test';

const ANCHOR = '/buscar'; // âncora neutra, distinta de qualquer destino de redirect

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

test.describe('Redirects legados — botão Voltar retorna à âncora, sem loop', () => {
  for (const [from, expectedPrefix] of LEGACY_REDIRECTS) {
    // Pula pares onde a âncora coincide com o destino do redirect (evita
    // falso positivo: voltar ficaria no mesmo lugar).
    if (expectedPrefix === ANCHOR || from === ANCHOR) continue;

    test(`back após ${from} → ${expectedPrefix} volta à âncora`, async ({ page }) => {
      // 1. Âncora estável.
      await page.goto(ANCHOR, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(new RegExp(ANCHOR + '$'));

      // 2. Alias legado — o React Router aplica <Navigate replace>.
      await page.goto(from, { waitUntil: 'domcontentloaded' });
      await page
        .waitForFunction(
          (target) => window.location.pathname.startsWith(target),
          expectedPrefix,
          { timeout: 5000 },
        )
        .catch(() => {
          /* /home → / edge case */
        });

      const afterRedirect = new URL(page.url()).pathname;
      expect(
        afterRedirect.startsWith(expectedPrefix),
        `esperava ${from} redirecionar para ${expectedPrefix}, chegou em ${afterRedirect}`,
      ).toBe(true);

      // 3. Voltar — deve pular o alias (replace) e retornar à âncora.
      await page.goBack({ waitUntil: 'domcontentloaded' });

      const afterBack = new URL(page.url()).pathname;

      // Não pode ter voltado ao alias legado (isso indicaria replace quebrado).
      expect(
        afterBack === from,
        `back voltou ao alias ${from} — <Navigate replace> não está funcionando`,
      ).toBe(false);

      // Não pode ter ficado no destino (isso indicaria back que não navegou).
      expect(
        afterBack.startsWith(expectedPrefix) && expectedPrefix !== ANCHOR,
        `back ficou preso em ${expectedPrefix} — possível loop`,
      ).toBe(false);

      // Deve ter voltado à âncora.
      expect(
        afterBack === ANCHOR || afterBack.startsWith(ANCHOR),
        `esperava back retornar a ${ANCHOR}, chegou em ${afterBack}`,
      ).toBe(true);

      // 4. Forward deve levar de volta ao destino (não ao alias).
      await page.goForward({ waitUntil: 'domcontentloaded' });
      const afterForward = new URL(page.url()).pathname;
      expect(
        afterForward === from,
        `forward reabriu o alias ${from} em vez do destino ${expectedPrefix}`,
      ).toBe(false);
      expect(
        afterForward.startsWith(expectedPrefix),
        `forward deveria voltar a ${expectedPrefix}, chegou em ${afterForward}`,
      ).toBe(true);
    });
  }
});
