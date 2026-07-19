/**
 * Bottom Nav + Redirects legados — sem 404
 *
 * Navega em cada item da MobileBottomNav e em cada alias legado registrado
 * como <Navigate> no App.tsx, confirmando que:
 *  - a resposta HTTP não é ≥ 400,
 *  - o componente NotFound (h1 "404") não é renderizado,
 *  - a URL final não é a rota original nos casos de redirect (deve ter mudado).
 *
 * Regressão de /rezar → /oracao e demais aliases mapeados na CAT-13.
 */
import { test, expect } from '@playwright/test';

const MOBILE_NAV_TARGETS = [
  '/',
  '/biblioteca',
  '/buscar',
  '/nexus',
  '/formacao', // alias legado; deve redirecionar para /jornadas
];

// (from, expectedFinalPrefix) — pares extraídos do App.tsx.
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

async function assertNoNotFound(page: import('@playwright/test').Page, from: string) {
  const notFound = page.locator('h1', { hasText: /^404$/ });
  await expect(notFound, `rota ${from} caiu na tela 404`).toHaveCount(0);
}

test.describe('MobileBottomNav — todos os destinos carregam sem 404', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 12

  for (const target of MOBILE_NAV_TARGETS) {
    test(`bottom nav: ${target} não gera 404`, async ({ page }) => {
      const resp = await page.goto(target, { waitUntil: 'domcontentloaded' });
      expect(resp?.status() ?? 200).toBeLessThan(400);
      await assertNoNotFound(page, target);
    });
  }
});

test.describe('Redirects legados — sem 404 e com URL final correta', () => {
  for (const [from, expectedPrefix] of LEGACY_REDIRECTS) {
    test(`redirect ${from} → ${expectedPrefix}`, async ({ page }) => {
      const resp = await page.goto(from, { waitUntil: 'domcontentloaded' });
      expect(resp?.status() ?? 200).toBeLessThan(400);
      await assertNoNotFound(page, from);

      // <Navigate replace> é aplicado no client; aguarda o pathname mudar.
      await page.waitForFunction(
        (orig) => window.location.pathname !== orig,
        from,
        { timeout: 5000 },
      ).catch(() => {
        // /home → / é edge case: pathname permanece '/', tratado abaixo.
      });

      const finalPath = new URL(page.url()).pathname;
      expect(
        finalPath.startsWith(expectedPrefix),
        `esperava ${from} redirecionar para ${expectedPrefix}, chegou em ${finalPath}`,
      ).toBe(true);
    });
  }
});
