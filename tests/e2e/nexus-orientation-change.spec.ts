/**
 * CAT-030 — Rotação de orientação mobile.
 * Após portrait → landscape → portrait, swipe threshold, clamp e taps devem
 * continuar funcionando.
 */
import { test, expect } from '@playwright/test';
import { openNexus, swipe, collectNoise, expectClean } from './_helpers/nexus';

const PORTRAIT = { width: 390, height: 844 };
const LANDSCAPE = { width: 844, height: 390 };

test.use({ viewport: PORTRAIT, hasTouch: true });

test('nexus continua responsivo após portrait→landscape→portrait', async ({ page }) => {
  const noise = collectNoise(page);
  const dialog = await openNexus(page);
  const active = () => dialog.locator('[data-testid="nexus-active-section"]').first();
  const bubbles = dialog.locator('[data-section-kind]');

  const total = await bubbles.count();
  test.skip(total < 2, 'Precisa de ≥ 2 seções.');

  // Landscape
  await page.setViewportSize(LANDSCAPE);
  await page.waitForTimeout(300);
  await expect(dialog).toBeVisible();

  // Volta para portrait
  await page.setViewportSize(PORTRAIT);
  await page.waitForTimeout(300);
  await expect(dialog).toBeVisible();

  const initialKind = await active().getAttribute('data-section-kind');

  // Swipe abaixo do threshold: não alterna.
  await swipe(dialog, -30);
  await page.waitForTimeout(150);
  expect(await active().getAttribute('data-section-kind')).toBe(initialKind);

  // Swipe válido: alterna.
  await swipe(dialog, -180);
  await expect
    .poll(async () => active().getAttribute('data-section-kind'), { timeout: 3000 })
    .not.toBe(initialKind);

  // Clamp: vai para o fim e swipa mais uma vez.
  for (let i = 0; i < total + 2; i += 1) {
    await swipe(dialog, -180);
    await page.waitForTimeout(60);
  }
  const clampedKind = await active().getAttribute('data-section-kind');
  expect(clampedKind).toBeTruthy();

  // Tap ainda funciona.
  const first = bubbles.first();
  const firstKind = await first.getAttribute('data-section-kind');
  await first.click();
  await expect
    .poll(async () => active().getAttribute('data-section-kind'), { timeout: 3000 })
    .toBe(firstKind);

  expectClean(noise);
});
