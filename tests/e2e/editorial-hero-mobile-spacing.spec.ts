import { test, expect } from '@playwright/test';
import {
  EDITORIAL_HERO_ROUTES,
  MOBILE_SPACING_WIDTHS,
  TOP_SPACING_EXPECTED_MOBILE,
  TOP_SPACING_EXPECTED_DESKTOP,
  getMinMobileTop,
} from './editorial-hero.config';

// Reexport para compatibilidade com specs antigos.
export { EDITORIAL_HERO_ROUTES } from './editorial-hero.config';

/**
 * Regressão de espaçamento dos EditorialHero legacy/editorial.
 * - Garante que o hero nunca fica "colado no topo" no mobile.
 * - Valida diretamente o padding computado por `data-top-spacing`.
 */

for (const routeCfg of EDITORIAL_HERO_ROUTES) {
  const { route, name, variant: expectedVariant } = routeCfg;
  const minTop = getMinMobileTop(routeCfg);

  for (const width of MOBILE_SPACING_WIDTHS) {
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
        .toBeGreaterThanOrEqual(minTop);

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

    const [dPad, mPad, variant, topSpacing] = await Promise.all([
      dHero.evaluate((el) => parseFloat(getComputedStyle(el).paddingTop || '0')),
      mHero.evaluate((el) => parseFloat(getComputedStyle(el).paddingTop || '0')),
      dHero.getAttribute('data-variant'),
      dHero.getAttribute('data-top-spacing'),
    ]);
    expect.soft(dPad, `${name} desktop paddingTop`).toBeGreaterThan(0);
    expect.soft(mPad, `${name} mobile paddingTop`).toBeGreaterThanOrEqual(minTop);
    expect.soft(variant, `${name} variant`).toBe(expectedVariant);
    if (expectedVariant === 'legacy') {
      expect.soft(topSpacing, `${name} topSpacing`).toBe('safe');
    }

    // Asserção direta do topSpacing (complementa o proxy do gap).
    const key = topSpacing ?? 'default';
    const expectedMobile = TOP_SPACING_EXPECTED_MOBILE[key];
    const expectedDesktop = TOP_SPACING_EXPECTED_DESKTOP[key];
    if (expectedMobile) {
      expect
        .soft(mPad, `${name} mobile paddingTop dentro da faixa esperada (topSpacing=${key})`)
        .toBeGreaterThanOrEqual(expectedMobile.min);
      expect
        .soft(mPad, `${name} mobile paddingTop dentro da faixa esperada (topSpacing=${key})`)
        .toBeLessThanOrEqual(expectedMobile.max);
    }
    if (expectedDesktop) {
      expect
        .soft(dPad, `${name} desktop paddingTop dentro da faixa esperada (topSpacing=${key})`)
        .toBeGreaterThanOrEqual(expectedDesktop.min);
      expect
        .soft(dPad, `${name} desktop paddingTop dentro da faixa esperada (topSpacing=${key})`)
        .toBeLessThanOrEqual(expectedDesktop.max);
    }

    await desktopCtx.close();
    await mobileCtx.close();
  });
}
