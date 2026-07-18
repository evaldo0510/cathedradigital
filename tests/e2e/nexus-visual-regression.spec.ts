/**
 * CAT-030 — Visual regression do painel Nexus.
 * Captura snapshots em pontos-chave (aberto e após swipe).
 * Use `--update-snapshots` para regravar baselines quando houver mudança intencional.
 */
import { test, expect } from '@playwright/test';
import { openNexus, swipe } from './_helpers/nexus';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

test('snapshots do Nexus: aberto e após swipe-left', async ({ page }) => {
  const dialog = await openNexus(page);
  // Desativa animações e caret para snapshot determinístico.
  await page.addStyleTag({
    content: `*, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent !important; }`,
  });
  await page.waitForTimeout(200);
  await expect(dialog).toHaveScreenshot('nexus-open.png', {
    maxDiffPixelRatio: 0.02,
    animations: 'disabled',
  });

  const total = await dialog.locator('[data-section-kind]').count();
  test.skip(total < 2, 'Precisa de ≥ 2 seções.');

  await swipe(dialog, -180);
  await page.waitForTimeout(300);
  await expect(dialog).toHaveScreenshot('nexus-after-swipe.png', {
    maxDiffPixelRatio: 0.02,
    animations: 'disabled',
  });
});
