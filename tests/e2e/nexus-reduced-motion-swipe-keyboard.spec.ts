/**
 * CAT-030 — Reduced-motion: swipe + navegação por teclado.
 * Após swipe, usar setas/Tab/Enter deve manter seção ativa consistente
 * e o outline de foco visível.
 */
import { test, expect } from '@playwright/test';
import { openNexus, swipe, collectNoise, expectClean } from './_helpers/nexus';

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  reducedMotion: 'reduce',
});

function ringOf(el: Element) {
  const s = window.getComputedStyle(el);
  return `${s.outlineStyle}:${s.outlineWidth}:${s.boxShadow}`;
}

test('reduced-motion: swipe + teclado mantêm seção ativa e foco visível', async ({ page }) => {
  const noise = collectNoise(page);
  const dialog = await openNexus(page);
  const active = () => dialog.locator('[data-testid="nexus-active-section"]').first();
  const sections = dialog.locator('[data-section-kind]');

  const total = await sections.count();
  test.skip(total < 3, 'Precisa de ≥ 3 seções.');

  const initialKind = await active().getAttribute('data-section-kind');

  // 1) Swipe alterna.
  await swipe(dialog, -180);
  await expect
    .poll(async () => active().getAttribute('data-section-kind'), { timeout: 3000 })
    .not.toBe(initialKind);
  const afterSwipe = await active().getAttribute('data-section-kind');

  // 2) `]` avança mais uma.
  await page.keyboard.press(']');
  await expect
    .poll(async () => active().getAttribute('data-section-kind'), { timeout: 3000 })
    .not.toBe(afterSwipe);
  await expect(sections.locator('[aria-current="true"]')).toHaveCount(1);

  // 3) `[` volta uma.
  await page.keyboard.press('[');
  await expect
    .poll(async () => active().getAttribute('data-section-kind'), { timeout: 3000 })
    .toBe(afterSwipe);

  // 4) Tab move o foco e outline continua visível.
  await page.keyboard.press('Tab');
  const ring1 = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return null;
    const s = window.getComputedStyle(el);
    return `${s.outlineStyle}:${s.outlineWidth}:${s.boxShadow}`;
  });
  expect(ring1, 'foco após Tab deve ter outline/box-shadow').not.toBeNull();
  expect(ring1).not.toMatch(/^none:0px:none$/);

  // 5) Focar bubble e ativar com Enter.
  const target = sections.first();
  const targetKind = await target.getAttribute('data-section-kind');
  await target.focus();
  const ring2 = await target.evaluate(ringOf);
  expect(ring2).not.toMatch(/^none:0px:none$/);
  await page.keyboard.press('Enter');
  await expect
    .poll(async () => active().getAttribute('data-section-kind'), { timeout: 3000 })
    .toBe(targetKind);
  await expect(sections.locator('[aria-current="true"]')).toHaveCount(1);

  const focusedTag = await page.evaluate(() => document.activeElement?.tagName ?? null);
  expect(focusedTag).not.toBe('BODY');

  expectClean(noise);
});
