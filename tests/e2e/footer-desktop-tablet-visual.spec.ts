/**
 * Regressão visual do rodapé em desktop e tablet:
 *  - Botão "Mais/Menos" NÃO deve existir (só faz sentido em mobile compacto).
 *  - Todos os links públicos aparecem simultaneamente.
 *  - Layout permanece estável entre renders.
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080';

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'tablet',  width: 1024, height: 800 },
  { name: 'tablet-portrait', width: 820, height: 1180 },
] as const;

for (const vp of VIEWPORTS) {
  test.describe(`Footer ${vp.name} (${vp.width}x${vp.height})`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('sem botão Mais/Menos + todos os links visíveis', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });

      const nav = page.locator('[data-testid="footer-public-nav"]').first();
      await nav.scrollIntoViewIfNeeded();
      await expect(nav).toBeVisible();

      // Mais/Menos só existe no mobile compacto
      await expect(page.locator('[data-testid="footer-mobile-expand"]')).toHaveCount(0);

      // Links institucionais mínimos devem estar todos visíveis (não colapsados)
      const minimum = ['Sobre', 'Parceiros', 'Privacidade', 'Termos', 'Transparência'];
      for (const label of minimum) {
        await expect(nav.getByRole('button', { name: label }).or(nav.getByRole('link', { name: label }))).toBeVisible();
      }

      await expect(nav).toHaveScreenshot(`footer-${vp.name}.png`, {
        maxDiffPixelRatio: 0.02,
        animations: 'disabled',
      });
    });
  });
}
