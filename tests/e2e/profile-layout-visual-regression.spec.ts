/**
 * Regressão visual do /profile em mobile e tablet.
 *
 * Objetivo: prevenir a regressão em que o container do Perfil recebia
 * `max-w-spacing-*` (token de espaçamento ≈ 3rem) no lugar de um token de
 * largura, esmagando todo o conteúdo em ~48–200px.
 *
 * Estratégia:
 *  - /profile é auth-guarded; mesmo anônimo (guard/login screen), o
 *    container principal precisa respeitar largura mínima razoável do
 *    viewport, provando que nenhum `max-w-spacing-*` foi reintroduzido no
 *    layout comum entre estado logado/deslogado.
 *  - Snapshot visual do <main> para detectar quebras estruturais.
 */

import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844, minMain: 320 },
  { name: 'tablet-portrait', width: 834, height: 1112, minMain: 640 },
  { name: 'tablet-landscape', width: 1112, height: 834, minMain: 800 },
];

test.describe('Profile — layout width regression (mobile/tablet)', () => {
  for (const vp of VIEWPORTS) {
    test(`/profile mantém largura útil em ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/profile', { waitUntil: 'domcontentloaded' });

      const main = page.locator('main').first();
      await expect(main).toBeVisible();

      // Guardrail: largura do <main> não pode colapsar para uma faixa estreita.
      // Bug histórico esmagava o conteúdo em ~48–200px por causa de
      // `max-w-spacing-*`. Exigimos pelo menos `minMain` px por viewport.
      const box = await main.boundingBox();
      expect(box, 'main deve ter bounding box').not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(vp.minMain);

      // Snapshot visual (fullPage é evitado para reduzir flakiness).
      await expect(main).toHaveScreenshot(`profile-${vp.name}.png`, {
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
      });
    });
  }
});
