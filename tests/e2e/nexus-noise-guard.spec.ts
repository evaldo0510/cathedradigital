/**
 * CAT-030 — Guardião de ruído durante interações no Nexus.
 * Falha se houver console.error, console.warn, pageerror ou falhas de rede
 * durante uma sequência de swipes e cliques.
 */
import { test, expect } from '@playwright/test';
import { openNexus, swipe, collectNoise, expectClean } from './_helpers/nexus';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

test('swipes e cliques no Nexus não geram warnings/errors/failures', async ({ page }) => {
  const noise = collectNoise(page);
  const dialog = await openNexus(page);
  const bubbles = dialog.locator('[data-section-kind]');
  const total = await bubbles.count();
  test.skip(total < 2, 'Precisa de ≥ 2 seções.');

  for (const dx of [-180, 180, -180, -180, 180]) {
    await swipe(dialog, dx);
    await page.waitForTimeout(80);
  }
  for (let i = 0; i < Math.min(total, 3); i += 1) {
    await bubbles.nth(i).click();
    await page.waitForTimeout(80);
  }

  expectClean(noise);
});
