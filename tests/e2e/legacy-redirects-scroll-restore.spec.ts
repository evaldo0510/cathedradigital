/**
 * Redirects legados — restauração de scroll ao voltar
 *
 * Cenário: usuário está numa página âncora, rola para baixo, clica em um link
 * que abre um alias legado (ex.: /rezar → /oracao). Ao clicar em "Voltar",
 * deve retornar à âncora com o scroll aproximadamente restaurado — nunca
 * "pulando" para o topo.
 *
 * Estratégia:
 *   1. Abre âncora (/buscar), aguarda conteúdo, rola para uma posição Y > 400.
 *   2. Salva scrollY registrado.
 *   3. Navega para o alias legado (client-side <Navigate replace>).
 *   4. Confirma que chegou no destino esperado.
 *   5. Aciona goBack() e valida:
 *        - URL voltou para a âncora
 *        - scrollY final está dentro de tolerância do salvo (≤ 100px)
 *        - scrollY NÃO é 0 (não "pulou" para o topo)
 *
 * Observação: como <Navigate replace> substitui a entrada do alias no
 * histórico, o browser trata o back como retorno normal à âncora, o que
 * habilita a restauração nativa de scroll do Chromium. Este teste blinda
 * essa expectativa contra regressões (ex.: alguém trocar replace por push,
 * ou adicionar um ScrollToTop agressivo que zere no back).
 */
import { test, expect, type Page } from '@playwright/test';

const ANCHOR = '/buscar';

// Subconjunto representativo dos redirects legados. Cobre variações:
// alias PT/EN, destinos distintos, prefixos únicos. O spec completo de
// back-button já valida todos os 33 aliases; aqui focamos no scroll.
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
];

const TARGET_SCROLL = 700;
const TOLERANCE = 120;

async function forceScrollableAndScroll(page: Page, targetY: number) {
  // Garante que há conteúdo suficiente para rolar (algumas páginas em preview
  // podem ficar curtas em viewport alta). Rola tanto window quanto #main-content
  // porque o ScrollToTop do projeto atua nos dois.
  await page.evaluate((y) => {
    const main = document.getElementById('main-content');
    if (main) main.scrollTo({ top: y, left: 0, behavior: 'instant' as ScrollBehavior });
    window.scrollTo({ top: y, left: 0, behavior: 'instant' as ScrollBehavior });
  }, targetY);
  // Pequena espera para o evento de scroll ser registrado pelo browser antes
  // do próximo goto (necessário para a restauração nativa funcionar).
  await page.waitForTimeout(150);
}

async function readScroll(page: Page): Promise<number> {
  return page.evaluate(() => {
    const main = document.getElementById('main-content');
    const mainY = main ? main.scrollTop : 0;
    return Math.max(window.scrollY, mainY);
  });
}

test.describe('Redirects legados — scroll restaurado no back, sem pular para o topo', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  for (const [from, expectedPrefix] of LEGACY_REDIRECTS) {
    if (expectedPrefix === ANCHOR || from === ANCHOR) continue;

    test(`back após ${from} → ${expectedPrefix} restaura scroll da âncora`, async ({ page }) => {
      // 1. Âncora.
      await page.goto(ANCHOR, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(new RegExp(ANCHOR + '$'));
      // Espera o layout estabilizar para que a altura do documento seja real.
      await page.waitForLoadState('networkidle').catch(() => {});

      const scrollable = await page.evaluate(() => {
        const main = document.getElementById('main-content');
        const docH = Math.max(
          document.documentElement.scrollHeight,
          main?.scrollHeight ?? 0,
        );
        const viewH = window.innerHeight;
        return docH - viewH;
      });

      if (scrollable < TARGET_SCROLL + 50) {
        test.skip(true, `âncora não tem altura suficiente para rolar ${TARGET_SCROLL}px`);
        return;
      }

      // 2. Rola e memoriza.
      await forceScrollableAndScroll(page, TARGET_SCROLL);
      const savedY = await readScroll(page);
      expect(savedY, 'scroll inicial não foi aplicado').toBeGreaterThan(400);

      // 3. Alias legado.
      await page.goto(from, { waitUntil: 'domcontentloaded' });
      await page
        .waitForFunction(
          (target) => window.location.pathname.startsWith(target),
          expectedPrefix,
          { timeout: 5000 },
        )
        .catch(() => {});

      const afterRedirect = new URL(page.url()).pathname;
      expect(
        afterRedirect.startsWith(expectedPrefix),
        `esperava ${from} → ${expectedPrefix}, chegou em ${afterRedirect}`,
      ).toBe(true);

      // 4. Back.
      await page.goBack({ waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(new RegExp(ANCHOR + '$'));

      // Aguarda o browser aplicar a restauração nativa de scroll (assíncrona
      // após o layout ser refeito).
      await page.waitForTimeout(400);
      const restoredY = await readScroll(page);

      // 5a. Não pulou para o topo.
      expect(
        restoredY,
        `back após ${from} pulou para o topo (scrollY=${restoredY}, esperado próximo a ${savedY})`,
      ).toBeGreaterThan(200);

      // 5b. Está dentro da tolerância da posição original.
      const delta = Math.abs(restoredY - savedY);
      expect(
        delta,
        `scroll não restaurado: esperado ~${savedY}, chegou ${restoredY} (Δ=${delta}px, tolerância ${TOLERANCE}px)`,
      ).toBeLessThanOrEqual(TOLERANCE);
    });
  }
});
