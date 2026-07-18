/**
 * CAT-030 — Swipes rápidos consecutivos no Nexus (mobile).
 *
 * Dispara uma sequência de swipes horizontais em rápida sucessão e valida:
 *  - a seção ativa continua consistente (data-section-kind válido);
 *  - o painel não fica travado (bubbles clicáveis, sem aria-disabled);
 *  - zero console.error / pageerror.
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

async function swipe(dialog: Locator, dx: number) {
  const startX = 320;
  const startY = 500;
  await dialog.dispatchEvent('touchstart', {
    touches: [{ clientX: startX, clientY: startY, identifier: 1 }],
    changedTouches: [{ clientX: startX, clientY: startY, identifier: 1 }],
  });
  await dialog.dispatchEvent('touchend', {
    touches: [],
    changedTouches: [{ clientX: startX + dx, clientY: startY, identifier: 1 }],
  });
}

test('swipes rápidos consecutivos mantêm estado consistente', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  const dialog = await openNexus(page);
  const active = () => dialog.locator('[data-testid="nexus-active-section"]').first();
  const bubbles = dialog.locator('[data-section-kind]');

  const total = await bubbles.count();
  test.skip(total < 2, 'Precisa de ≥ 2 seções para o teste.');

  const validKinds = new Set<string>();
  for (let i = 0; i < total; i += 1) {
    const k = await bubbles.nth(i).getAttribute('data-section-kind');
    if (k) validKinds.add(k);
  }

  // 20 swipes alternando direção, quase sem pausa.
  const sequence = [-160, -160, 160, -160, 160, 160, -160, -160, 160, -160,
                    160, -160, -160, 160, 160, -160, 160, -160, -160, 160];
  for (const dx of sequence) {
    await swipe(dialog, dx);
    await page.waitForTimeout(30);
  }

  // Deixa o React estabilizar.
  await page.waitForTimeout(400);

  // Estado final: seção ativa é uma das seções válidas.
  const finalKind = await active().getAttribute('data-section-kind');
  expect(finalKind, 'seção ativa nula ou inválida após burst').not.toBeNull();
  expect(validKinds.has(finalKind ?? '')).toBe(true);

  // Painel não travou: nenhum bubble desabilitado.
  const disabled = await dialog.locator('[data-section-kind][aria-disabled="true"]').count();
  expect(disabled).toBe(0);

  // Painel continua responsivo: tap em qualquer bubble muda para aquela seção.
  const targetIdx = (await active().getAttribute('data-section-kind')) === await bubbles.first().getAttribute('data-section-kind') ? total - 1 : 0;
  const target = bubbles.nth(targetIdx);
  const targetKind = await target.getAttribute('data-section-kind');
  await target.click();
  await expect
    .poll(async () => active().getAttribute('data-section-kind'), { timeout: 3000 })
    .toBe(targetKind);

  expect(errors).toEqual([]);
});
