import { test, expect } from '@playwright/test';

/**
 * Regressão visual /pricing — desktop e mobile.
 * Detecta quebras de layout, duplicação de conteúdo e alterações inesperadas
 * na seção de planos e no comparativo de features.
 *
 * Baselines vivem em tests/e2e/pricing-visual-regression.spec.ts-snapshots/.
 * Regerar com: bunx playwright test tests/e2e/pricing-visual-regression.spec.ts --update-snapshots
 */

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
] as const;

test.describe('/pricing · regressão visual', () => {
  for (const vp of VIEWPORTS) {
    test(`snapshot completo — ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/pricing');
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('[data-testid="plan-card-pro"]');
      // Congela animações para snapshot estável
      await page.addStyleTag({
        content: `*,*::before,*::after{animation:none!important;transition:none!important}`,
      });
      await page.waitForTimeout(200);

      await expect(page.getByTestId('plan-card-free')).toHaveScreenshot(
        `pricing-card-free-${vp.name}.png`,
      );
      await expect(page.getByTestId('plan-card-pro')).toHaveScreenshot(
        `pricing-card-pro-${vp.name}.png`,
      );
    });
  }

  test('cards não duplicam grupos de features', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    for (const variant of ['free', 'pro'] as const) {
      const card = page.getByTestId(`plan-card-${variant}`);
      const groups = await card.getByTestId(`group-header-${variant}`).allInnerTexts();
      const uniq = new Set(groups.map((g) => g.trim().toLowerCase()));
      expect(groups.length, `duplicação de grupos no card ${variant}: ${groups.join(', ')}`).toBe(
        uniq.size,
      );
      expect(groups.length).toBeGreaterThan(0);
    }
  });
});
