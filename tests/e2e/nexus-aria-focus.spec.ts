/**
 * CAT-030 — Atributos ARIA e foco por seção do Nexus.
 * Após swipe e teclado, `aria-current="true"` deve mover para a seção ativa
 * (tanto no dot quanto na section), exatamente uma seção ativa por vez,
 * e o foco deve permanecer em um elemento interativo (não cair no body).
 */
import { test, expect } from '@playwright/test';
import { openNexus, swipe, collectNoise, expectClean } from './_helpers/nexus';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

test('aria-current e foco acompanham a seção ativa após swipe e teclado', async ({ page }) => {
  const noise = collectNoise(page);
  const dialog = await openNexus(page);

  const sections = dialog.locator('[data-section-kind]');
  const dots = dialog.locator('[data-testid="nexus-section-dots"] [aria-label]');
  const activeSection = () => dialog.locator('[data-testid="nexus-active-section"]');

  const total = await sections.count();
  test.skip(total < 2, 'Precisa de ≥ 2 seções.');

  // Estado inicial: exatamente 1 seção com aria-current="true".
  const initiallyActive = sections.locator('[aria-current="true"]');
  await expect(initiallyActive).toHaveCount(1);
  await expect(activeSection()).toHaveCount(1);

  const initialKind = await activeSection().getAttribute('data-section-kind');

  // Swipe alterna: aria-current move.
  await swipe(dialog, -180);
  await expect
    .poll(async () => activeSection().getAttribute('data-section-kind'), { timeout: 3000 })
    .not.toBe(initialKind);
  const newKind = await activeSection().getAttribute('data-section-kind');

  // Continua havendo exatamente 1 seção ativa e 1 dot ativo.
  await expect(sections.locator('[aria-current="true"]')).toHaveCount(1);
  const activeDots = dots.locator('[aria-current="true"]');
  const dotsCount = await dots.count();
  if (dotsCount > 0) await expect(activeDots).toHaveCount(1);

  // Teclado: `[` volta e aria-current acompanha.
  await page.keyboard.press('[');
  await expect
    .poll(async () => activeSection().getAttribute('data-section-kind'), { timeout: 3000 })
    .toBe(initialKind);
  await expect(sections.locator('[aria-current="true"]')).toHaveCount(1);

  // Foco: ativar via Enter em uma bubble mantém foco em elemento interativo.
  const target = sections.nth(total - 1);
  const targetKind = await target.getAttribute('data-section-kind');
  await target.focus();
  await expect(target).toBeFocused();
  await page.keyboard.press('Enter');
  await expect
    .poll(async () => activeSection().getAttribute('data-section-kind'), { timeout: 3000 })
    .toBe(targetKind);

  const focusInfo = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return {
      tag: el?.tagName ?? null,
      interactive: !!el?.closest('button, a, [role="button"], input, textarea, [tabindex]'),
    };
  });
  expect(focusInfo.tag).not.toBe('BODY');
  expect(focusInfo.interactive).toBe(true);

  // Nada visível deve ter aria-hidden="true" contendo focáveis (anti-pattern).
  const hiddenWithFocusable = await dialog
    .locator('[aria-hidden="true"]:has(button:visible, a:visible, [tabindex="0"]:visible)')
    .count();
  expect(hiddenWithFocusable).toBe(0);

  expect(newKind).toBeTruthy();
  expectClean(noise);
});
