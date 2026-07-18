/**
 * CAT-030 — Reduced-motion: gestos de toque puros.
 * touchstart/touchend devem alternar seção (swipe horizontal) e permitir
 * rolagem vertical, sem perder foco visível.
 */
import { test, expect } from '@playwright/test';
import { openNexus, swipe, collectNoise, expectClean } from './_helpers/nexus';

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  reducedMotion: 'reduce',
});

test('reduced-motion + touch: alterna, rola e mantém foco visível', async ({ page }) => {
  const noise = collectNoise(page);
  const dialog = await openNexus(page);
  const active = () => dialog.locator('[data-testid="nexus-active-section"]').first();
  const sections = dialog.locator('[data-section-kind]');

  const total = await sections.count();
  test.skip(total < 2, 'Precisa de ≥ 2 seções.');

  const initialKind = await active().getAttribute('data-section-kind');

  // Swipe horizontal alterna.
  await swipe(dialog, -180);
  await expect
    .poll(async () => active().getAttribute('data-section-kind'), { timeout: 3000 })
    .not.toBe(initialKind);
  const afterSwipe = await active().getAttribute('data-section-kind');

  // Gesto vertical (dy dominante) NÃO deve alternar.
  await swipe(dialog, 20, 200);
  await page.waitForTimeout(200);
  expect(await active().getAttribute('data-section-kind')).toBe(afterSwipe);

  // Rolagem vertical no conteúdo da seção ativa não pode alterar seção.
  const box = await active().boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(200);
  expect(await active().getAttribute('data-section-kind')).toBe(afterSwipe);

  // Foco visível: focar uma bubble e checar outline/box-shadow.
  const target = sections.first();
  await target.focus();
  await expect(target).toBeFocused();
  const ring = await target.evaluate((el) => {
    const s = window.getComputedStyle(el);
    return `${s.outlineStyle}:${s.outlineWidth}:${s.boxShadow}`;
  });
  expect(ring, 'foco visível deve existir com reduced-motion').not.toMatch(/^none:0px:none$/);

  // Tap na bubble (touchstart/touchend no mesmo ponto) ativa e mantém foco fora do body.
  const tbox = await target.boundingBox();
  expect(tbox).not.toBeNull();
  const tx = tbox!.x + tbox!.width / 2;
  const ty = tbox!.y + tbox!.height / 2;
  await target.dispatchEvent('touchstart', {
    touches: [{ clientX: tx, clientY: ty, identifier: 1 }],
    changedTouches: [{ clientX: tx, clientY: ty, identifier: 1 }],
  });
  await target.dispatchEvent('touchend', {
    touches: [],
    changedTouches: [{ clientX: tx, clientY: ty, identifier: 1 }],
  });
  await target.click();
  const targetKind = await target.getAttribute('data-section-kind');
  await expect
    .poll(async () => active().getAttribute('data-section-kind'), { timeout: 3000 })
    .toBe(targetKind);

  const focusedTag = await page.evaluate(() => document.activeElement?.tagName ?? null);
  expect(focusedTag).not.toBe('BODY');

  expectClean(noise);
});
