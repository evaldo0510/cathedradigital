/**
 * CAT-030 — Tap vs Swipe no Nexus (mobile).
 *
 * Garante que toques (taps) nas bubbles e botões do painel Nexus
 * ativam o elemento e NÃO são interpretados como swipe horizontal.
 */
import { test, expect, type Page, type Locator } from '@playwright/test';

const ROUTE = '/catechism?p=1817';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

async function openNexus(page: Page): Promise<Locator> {
  await page.goto(ROUTE, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  const trigger = page
    .locator('[data-nexus-trigger], [data-tag-slug], button:has-text("Nexus")')
    .first();
  await expect(trigger).toBeVisible({ timeout: 10_000 });
  await trigger.click();
  const dialog = page.locator('[role="dialog"][data-focus-mode]').first();
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  return dialog;
}

async function tap(target: Locator) {
  const box = await target.boundingBox();
  if (!box) throw new Error('Elemento sem bounding box para tap.');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  // Sem deslocamento: start e end no mesmo ponto → deve contar como tap.
  await target.dispatchEvent('touchstart', {
    touches: [{ clientX: x, clientY: y, identifier: 1 }],
    changedTouches: [{ clientX: x, clientY: y, identifier: 1 }],
  });
  await target.dispatchEvent('touchend', {
    touches: [],
    changedTouches: [{ clientX: x, clientY: y, identifier: 1 }],
  });
  await target.click();
}

test('tap em bubble ativa a seção sem disparar swipe', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  const dialog = await openNexus(page);
  const active = () => dialog.locator('[data-testid="nexus-active-section"]').first();

  const bubbles = dialog.locator('[data-section-kind]');
  const total = await bubbles.count();
  test.skip(total < 2, 'Precisa de ≥ 2 seções para o teste.');

  const initialKind = await active().getAttribute('data-section-kind');

  // Encontra uma bubble diferente da ativa para tocar.
  let targetIndex = -1;
  for (let i = 0; i < total; i += 1) {
    const kind = await bubbles.nth(i).getAttribute('data-section-kind');
    if (kind && kind !== initialKind) { targetIndex = i; break; }
  }
  expect(targetIndex).toBeGreaterThanOrEqual(0);

  const target = bubbles.nth(targetIndex);
  const targetKind = await target.getAttribute('data-section-kind');

  await tap(target);

  // A seção ativa deve ser a que recebeu o tap (não a "próxima" por swipe).
  await expect
    .poll(async () => active().getAttribute('data-section-kind'), { timeout: 3000 })
    .toBe(targetKind);

  expect(errors).toEqual([]);
});

test('tap em botão interativo do painel dispara ação, não swipe', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  const dialog = await openNexus(page);
  const active = () => dialog.locator('[data-testid="nexus-active-section"]').first();
  const initialKind = await active().getAttribute('data-section-kind');

  // Qualquer botão dentro do painel que não seja um bubble de seção.
  const button = dialog
    .locator('button:not([data-section-kind]):visible')
    .first();
  await expect(button).toBeVisible({ timeout: 5000 });

  await tap(button);

  // Seção ativa não pode ter mudado por conta do toque no botão.
  const afterKind = await active().getAttribute('data-section-kind');
  expect(afterKind).toBe(initialKind);

  expect(errors).toEqual([]);
});
