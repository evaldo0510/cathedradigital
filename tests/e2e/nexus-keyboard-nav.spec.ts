/**
 * CAT-030 — Navegação por teclado no Nexus.
 * Setas / Tab / Enter alternam seções e mantêm foco visível.
 */
import { test, expect } from '@playwright/test';
import { openNexus, collectNoise, expectClean } from './_helpers/nexus';

test.use({ viewport: { width: 1280, height: 900 } });

test('teclado alterna seções e preserva foco visível', async ({ page }) => {
  const noise = collectNoise(page);
  const dialog = await openNexus(page);
  const active = () => dialog.locator('[data-testid="nexus-active-section"]').first();
  const bubbles = dialog.locator('[data-section-kind]');
  const total = await bubbles.count();
  test.skip(total < 2, 'Precisa de ≥ 2 seções.');

  const initialKind = await active().getAttribute('data-section-kind');

  // Atalhos "[" e "]" já suportados pelo Nexus.
  await page.keyboard.press(']');
  await expect
    .poll(async () => active().getAttribute('data-section-kind'), { timeout: 3000 })
    .not.toBe(initialKind);
  const nextKind = await active().getAttribute('data-section-kind');

  await page.keyboard.press('[');
  await expect
    .poll(async () => active().getAttribute('data-section-kind'), { timeout: 3000 })
    .toBe(initialKind);

  // Tab move o foco para dentro do painel; Enter ativa a bubble focada.
  await page.keyboard.press('Tab');
  // Foca uma bubble específica e ativa via Enter.
  const target = bubbles.nth(total - 1);
  await target.focus();
  const focusRing = await target.evaluate((el) => {
    const s = window.getComputedStyle(el);
    return `${s.outlineStyle}:${s.outlineWidth}:${s.boxShadow}`;
  });
  expect(focusRing).not.toMatch(/^none:0px:none$/);

  const targetKind = await target.getAttribute('data-section-kind');
  await page.keyboard.press('Enter');
  await expect
    .poll(async () => active().getAttribute('data-section-kind'), { timeout: 3000 })
    .toBe(targetKind);
  expect(nextKind).toBeTruthy();

  expectClean(noise);
});
