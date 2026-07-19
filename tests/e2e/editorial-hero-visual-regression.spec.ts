import { test, expect } from '@playwright/test';
import {
  EDITORIAL_HERO_ROUTES,
  VISUAL_VIEWPORTS,
  MASK_SELECTORS,
  getMaxDiff,
} from './editorial-hero.config';

/**
 * Regressão visual pixel-diff dos EditorialHero.
 *
 * Cobre viewports extremos (320) + tablet (768) além de 375/1280 para
 * reduzir risco de regressões que passam nos breakpoints "seguros".
 *
 * Configuração centralizada em `editorial-hero.config.ts`
 * (breakpoints, thresholds e overrides por rota/variant).
 *
 * Atualizar baselines:
 *   bun run test:editorial-hero:update
 */

for (const routeCfg of EDITORIAL_HERO_ROUTES) {
  const { route, name } = routeCfg;
  const maxDiff = getMaxDiff(routeCfg);

  for (const vp of VISUAL_VIEWPORTS) {
    test(`visual: ${name} hero @${vp.name}`, async ({ browser }) => {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
        reducedMotion: 'reduce',
      });
      const page = await ctx.newPage();
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const hero = page.locator('[data-editorial-hero]').first();
      await hero.waitFor({ state: 'visible', timeout: 20_000 });
      await page.evaluate(() =>
        (document as unknown as { fonts: { ready: Promise<void> } }).fonts.ready,
      );
      await page.waitForTimeout(400);

      await expect(hero).toHaveScreenshot(`hero-${name}-${vp.name}.png`, {
        mask: MASK_SELECTORS.map((s) => page.locator(s)),
        animations: 'disabled',
        maxDiffPixelRatio: maxDiff,
      });
      await ctx.close();
    });
  }

  test(`visual: ${name} — proporção topo do hero coerente entre desktop e mobile`, async ({ browser }) => {
    const desktop = VISUAL_VIEWPORTS.find((v) => v.name === 'desktop-1280')!;
    const mobile = VISUAL_VIEWPORTS.find((v) => v.name === 'mobile-375')!;
    const results: Record<string, number> = {};
    for (const vp of [desktop, mobile]) {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await ctx.newPage();
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const hero = page.locator('[data-editorial-hero]').first();
      await hero.waitFor({ state: 'visible', timeout: 20_000 });
      const gap = await hero.evaluate((el) => {
        const first = el.querySelector<HTMLElement>(':scope > div > *');
        if (!first) return -1;
        const heroTop = el.getBoundingClientRect().top;
        const firstTop = first.getBoundingClientRect().top;
        return firstTop - heroTop;
      });
      results[vp.name] = gap;
      await ctx.close();
    }
    expect.soft(results['mobile-375'], `${name} mobile gap topo`).toBeGreaterThanOrEqual(24);
    expect.soft(results['desktop-1280'], `${name} desktop gap topo`).toBeGreaterThanOrEqual(12);
  });
}
