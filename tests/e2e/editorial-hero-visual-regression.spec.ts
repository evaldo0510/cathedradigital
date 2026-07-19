import { test, expect } from '@playwright/test';
import { EDITORIAL_HERO_ROUTES } from './editorial-hero-mobile-spacing.spec';

/**
 * Regressão visual pixel-diff dos EditorialHero.
 *
 * Estratégia:
 * - Captura screenshot do elemento [data-editorial-hero] em desktop (1280)
 *   e em mobile (375) para cada rota.
 * - Compara com baseline (playwright-snapshots) via toHaveScreenshot.
 *   Falha automaticamente se:
 *     - padding do topo mudar (hero volta a "colar")
 *     - tipografia/alinhamento regredirem
 *     - badge/ícone mudarem de posição
 *
 * Complementa o check de paddingTop (mobile-spacing) capturando drift visual
 * que valores computados não detectam (ex.: transform, font metrics, filete).
 *
 * Como atualizar baselines legítimas:
 *   bunx playwright test editorial-hero-visual-regression --update-snapshots
 */

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'mobile', width: 375, height: 900 },
] as const;

// Máscaras para conteúdo volátil (data dinâmica, contagens, etc.).
// Vazio por default — heros são estáticos. Adicione seletores aqui se surgir flake.
const MASK_SELECTORS: string[] = [];

for (const { route, name } of EDITORIAL_HERO_ROUTES) {
  for (const vp of VIEWPORTS) {
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
      // Aguardar fontes para evitar diff por fallback → serif final.
      await page.evaluate(() => (document as unknown as { fonts: { ready: Promise<void> } }).fonts.ready);
      // Pequena estabilização para animações CSS de entrada.
      await page.waitForTimeout(400);

      await expect(hero).toHaveScreenshot(`hero-${name}-${vp.name}.png`, {
        mask: MASK_SELECTORS.map((s) => page.locator(s)),
        animations: 'disabled',
        maxDiffPixelRatio: 0.03,
      });
      await ctx.close();
    });
  }

  test(`visual: ${name} — proporção topo do hero coerente entre desktop e mobile`, async ({ browser }) => {
    // Complementa o pixel-diff: valida que o primeiro elemento interno do hero
    // NUNCA encosta na borda superior (proxy para "colagem" que sobrevive a
    // mudanças de padding via classe utilitária).
    const results: Record<string, number> = {};
    for (const vp of VIEWPORTS) {
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
    // Mobile deve ter respiro ≥ 24px; desktop ≥ 12px.
    expect.soft(results.mobile, `${name} mobile gap topo`).toBeGreaterThanOrEqual(24);
    expect.soft(results.desktop, `${name} desktop gap topo`).toBeGreaterThanOrEqual(12);
  });
}
