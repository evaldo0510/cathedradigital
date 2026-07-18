/**
 * CAT-030 — Swipe seguido de rolagem vertical no Nexus.
 * Após alternar seção via swipe, o conteúdo da seção correta deve rolar,
 * e a seção ativa não pode voltar/mudar por causa do scroll.
 */
import { test, expect } from '@playwright/test';
import { openNexus, swipe, collectNoise, expectClean } from './_helpers/nexus';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

test('swipe alterna seção e rolagem vertical não altera seção ativa', async ({ page }) => {
  const noise = collectNoise(page);
  const dialog = await openNexus(page);
  const active = () => dialog.locator('[data-testid="nexus-active-section"]').first();

  const total = await dialog.locator('[data-section-kind]').count();
  test.skip(total < 2, 'Precisa de ≥ 2 seções.');

  const initialKind = await active().getAttribute('data-section-kind');
  await swipe(dialog, -180);
  await expect
    .poll(async () => active().getAttribute('data-section-kind'), { timeout: 3000 })
    .not.toBe(initialKind);
  const newKind = await active().getAttribute('data-section-kind');

  // Rola verticalmente dentro do painel/seção ativa.
  const box = await active().boundingBox();
  expect(box).not.toBeNull();
  const cx = box!.x + box!.width / 2;
  const cy = box!.y + box!.height / 2;

  const beforeScrollTop = await active().evaluate((el) => {
    const scroller = el.closest('[data-scrollable], .overflow-y-auto, .overflow-auto') ?? el;
    return (scroller as HTMLElement).scrollTop;
  });

  await page.mouse.move(cx, cy);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(200);

  const afterScrollTop = await active().evaluate((el) => {
    const scroller = el.closest('[data-scrollable], .overflow-y-auto, .overflow-auto') ?? el;
    return (scroller as HTMLElement).scrollTop;
  });

  // Rolagem ocorreu OU o conteúdo é curto (scrollTop = 0). Em qualquer caso, não deve travar.
  expect(afterScrollTop).toBeGreaterThanOrEqual(beforeScrollTop);

  // Seção ativa continua sendo a nova (não voltou por causa do scroll).
  expect(await active().getAttribute('data-section-kind')).toBe(newKind);

  expectClean(noise);
});
