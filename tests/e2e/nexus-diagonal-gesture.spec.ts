/**
 * CAT-030 — Gestos diagonais no Nexus.
 * Quando |dy| >= |dx|, a lógica ignora o swipe (prioriza scroll vertical).
 * Quando |dx| > |dy| e |dx| >= 50, alterna seção.
 * Em ambos os casos, o comportamento deve ser consistente e sem "saltos".
 */
import { test, expect } from '@playwright/test';
import { openNexus, swipe, collectNoise, expectClean } from './_helpers/nexus';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

test('gestos diagonais: escolha alternar × rolar é consistente', async ({ page }) => {
  const noise = collectNoise(page);
  const dialog = await openNexus(page);
  const active = () => dialog.locator('[data-testid="nexus-active-section"]').first();

  const total = await dialog.locator('[data-section-kind]').count();
  test.skip(total < 2, 'Precisa de ≥ 2 seções.');

  const initialKind = await active().getAttribute('data-section-kind');

  // Diagonal dominante em Y (dx=60, dy=120) → NÃO alterna.
  await swipe(dialog, -60, 120);
  await page.waitForTimeout(200);
  expect(
    await active().getAttribute('data-section-kind'),
    'diagonal dominante em Y não deve alternar',
  ).toBe(initialKind);

  // Diagonal dominante em X (dx=180, dy=60) → alterna.
  await swipe(dialog, -180, 60);
  await expect
    .poll(async () => active().getAttribute('data-section-kind'), { timeout: 3000 })
    .not.toBe(initialKind);
  const afterKind = await active().getAttribute('data-section-kind');

  // Repetir o mesmo gesto dominante em Y não deve reverter.
  await swipe(dialog, 60, 120);
  await page.waitForTimeout(200);
  expect(await active().getAttribute('data-section-kind')).toBe(afterKind);

  expectClean(noise);
});
