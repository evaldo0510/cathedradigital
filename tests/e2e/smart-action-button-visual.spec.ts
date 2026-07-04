import { test, expect, devices } from '@playwright/test';

/**
 * Visual regression do SmartActionButton (FAB central da BottomNav).
 * Garante alinhamento e posicionamento correto em mobile, tablet e desktop.
 *
 * Observação: em desktop/tablet a BottomNav usa `lg:hidden`, então o FAB
 * NÃO deve estar visível — o teste valida essa ausência explicitamente.
 */

const viewports = [
  { name: 'mobile',  device: devices['iPhone 12'],         shouldBeVisible: true  },
  { name: 'tablet',  device: devices['iPad (gen 7)'],      shouldBeVisible: true  },
  { name: 'desktop', viewport: { width: 1440, height: 900 }, shouldBeVisible: false },
] as const;

for (const v of viewports) {
  test.describe(`SmartActionButton — visual regression (${v.name})`, () => {
    test.use('device' in v ? v.device : { viewport: v.viewport });

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      // Desabilita animações para estabilizar screenshot
      await page.addStyleTag({
        content: `*, *::before, *::after { animation: none !important; transition: none !important; }`,
      });
      await page.waitForLoadState('networkidle');
    });

    test(`alinhamento e visibilidade em ${v.name}`, async ({ page }) => {
      const fab = page.getByTestId('smart-action-button');

      if (!v.shouldBeVisible) {
        // Em telas ≥ lg a BottomNav (e o FAB) devem estar ocultos.
        await expect(fab).toHaveCount(0);
        return;
      }

      await expect(fab).toBeVisible();

      // Snapshot do FAB isolado — foco em alinhamento/estilo, não no fundo.
      await expect(fab).toHaveScreenshot(`smart-action-button-${v.name}.png`, {
        animations: 'disabled',
      });

      // Sanity check: centralizado horizontalmente na viewport (±2px).
      const box = await fab.boundingBox();
      const vp = page.viewportSize()!;
      expect(box).not.toBeNull();
      const center = box!.x + box!.width / 2;
      expect(Math.abs(center - vp.width / 2)).toBeLessThanOrEqual(2);

      // Sanity check: dimensões esperadas (56x56).
      expect(box!.width).toBeGreaterThanOrEqual(52);
      expect(box!.width).toBeLessThanOrEqual(60);
      expect(box!.height).toBeGreaterThanOrEqual(52);
      expect(box!.height).toBeLessThanOrEqual(60);
    });
  });
}
