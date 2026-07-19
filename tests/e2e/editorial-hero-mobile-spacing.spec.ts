import { test, expect, devices } from '@playwright/test';

/**
 * Regressão visual dos EditorialHero legacy:
 * - Garante que o hero nunca fica "colado no topo" no mobile.
 * - Compara consistência entre desktop e mobile em múltiplas larguras.
 * - Se o padding topo real for < 24px, falha (proxy para colagem visual).
 */

// Cobertura completa das páginas que consomem EditorialHero.
// Ao adicionar uma nova rota que use <EditorialHero>, inclua-a aqui.
export const EDITORIAL_HERO_ROUTES = [
  { route: '/biblia', name: 'Bible', variant: 'legacy' as const },
  { route: '/magisterio', name: 'Magisterium', variant: 'legacy' as const },
  { route: '/santos', name: 'Saints', variant: 'legacy' as const },
  { route: '/biblioteca', name: 'Biblioteca', variant: 'editorial' as const },
];

const HEROS = EDITORIAL_HERO_ROUTES;
const MOBILE_WIDTHS = [320, 375, 414];
const MIN_MOBILE_TOP_PADDING_LEGACY = 24; // px — abaixo disso consideramos "colado"
const MIN_MOBILE_TOP_PADDING_EDITORIAL = 16; // editorial usa escala fluida, tolerância menor


for (const { route, name } of HEROS) {
  for (const width of MOBILE_WIDTHS) {
    test(`${name} hero @${width}px não fica colado no topo`, async ({ browser }) => {
      const ctx = await browser.newContext({
        viewport: { width, height: 800 },
        deviceScaleFactor: 2,
      });
      const page = await ctx.newPage();
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const hero = page.locator('[data-editorial-hero]').first();
      await hero.waitFor({ state: 'visible', timeout: 15_000 });

      const paddingTop = await hero.evaluate((el) =>
        parseFloat(getComputedStyle(el).paddingTop || '0'),
      );
      expect
        .soft(paddingTop, `${name} @${width}px paddingTop=${paddingTop}`)
        .toBeGreaterThanOrEqual(MIN_MOBILE_TOP_PADDING);

      await hero.screenshot({
        path: `test-results/hero-${name}-${width}.png`,
      });
      await ctx.close();
    });
  }

  test(`${name} hero desktop×mobile mantém padding coerente`, async ({ browser }) => {
    const desktopCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const mobileCtx = await browser.newContext({ viewport: { width: 375, height: 800 } });
    const dPage = await desktopCtx.newPage();
    const mPage = await mobileCtx.newPage();
    await Promise.all([
      dPage.goto(route, { waitUntil: 'domcontentloaded' }),
      mPage.goto(route, { waitUntil: 'domcontentloaded' }),
    ]);
    const dHero = dPage.locator('[data-editorial-hero]').first();
    const mHero = mPage.locator('[data-editorial-hero]').first();
    await Promise.all([dHero.waitFor({ state: 'visible' }), mHero.waitFor({ state: 'visible' })]);

    const [dPad, mPad, variant] = await Promise.all([
      dHero.evaluate((el) => parseFloat(getComputedStyle(el).paddingTop || '0')),
      mHero.evaluate((el) => parseFloat(getComputedStyle(el).paddingTop || '0')),
      dHero.getAttribute('data-variant'),
    ]);
    // Ambos > 0 e mobile ≥ MIN
    expect.soft(dPad, `${name} desktop paddingTop`).toBeGreaterThan(0);
    expect.soft(mPad, `${name} mobile paddingTop`).toBeGreaterThanOrEqual(MIN_MOBILE_TOP_PADDING);
    // Variant legacy DEVE ter topSpacing safe (default do componente).
    if (variant === 'legacy') {
      const topSpacing = await dHero.getAttribute('data-top-spacing');
      expect.soft(topSpacing, `${name} topSpacing`).toBe('safe');
    }
    await desktopCtx.close();
    await mobileCtx.close();
  });
}
