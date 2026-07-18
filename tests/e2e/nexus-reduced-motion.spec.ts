/**
 * CAT-030 — Nexus com prefers-reduced-motion: reduce.
 * Garante que swipe e teclado ainda alternam seções, e o foco visível
 * permanece após interações.
 */
import { test, expect } from '@playwright/test';
import { openNexus, swipe, collectNoise, expectClean } from './_helpers/nexus';

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  reducedMotion: 'reduce',
});

test('reduced-motion: swipe e teclado alternam seções sem quebrar foco', async ({ page }) => {
  const noise = collectNoise(page);

  // Sanity: media query realmente ativa.
  await page.goto('about:blank');
  const reduced = await page.evaluate(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  expect(reduced).toBe(true);

  const dialog = await openNexus(page);
  const active = () => dialog.locator('[data-testid="nexus-active-section"]').first();
  const bubbles = dialog.locator('[data-section-kind]');
  const total = await bubbles.count();
  test.skip(total < 2, 'Precisa de ≥ 2 seções.');

  const initialKind = await active().getAttribute('data-section-kind');

  // Swipe válido alterna.
  await swipe(dialog, -180);
  await expect
    .poll(async () => active().getAttribute('data-section-kind'), { timeout: 3000 })
    .not.toBe(initialKind);

  // Teclado (`[`) volta.
  await page.keyboard.press('[');
  await expect
    .poll(async () => active().getAttribute('data-section-kind'), { timeout: 3000 })
    .toBe(initialKind);

  // Foco visível ao tabular para uma bubble.
  const target = bubbles.nth(total - 1);
  await target.focus();
  await expect(target).toBeFocused();
  const ring = await target.evaluate((el) => {
    const s = window.getComputedStyle(el);
    return `${s.outlineStyle}:${s.outlineWidth}:${s.boxShadow}`;
  });
  expect(ring, 'foco visível deve existir mesmo com reduced-motion').not.toMatch(/^none:0px:none$/);

  // Enter ativa sem quebrar o foco.
  const targetKind = await target.getAttribute('data-section-kind');
  await page.keyboard.press('Enter');
  await expect
    .poll(async () => active().getAttribute('data-section-kind'), { timeout: 3000 })
    .toBe(targetKind);

  const focusedTag = await page.evaluate(() => document.activeElement?.tagName ?? null);
  expect(focusedTag, 'foco não pode ir para o body após Enter').not.toBe('BODY');

  expectClean(noise);
});
