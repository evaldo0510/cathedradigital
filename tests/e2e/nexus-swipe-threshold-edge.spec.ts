/**
 * CAT-030 — Threshold exato de swipe no Nexus (mobile).
 *
 * Confirma o comportamento na borda do threshold (~50px):
 *  - dx = 49px → NÃO alterna
 *  - dx = 50px → alterna
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

async function swipe(dialog: Locator, dx: number, dy = 0) {
  const startX = 320;
  const startY = 500;
  await dialog.dispatchEvent('touchstart', {
    touches: [{ clientX: startX, clientY: startY, identifier: 1 }],
    changedTouches: [{ clientX: startX, clientY: startY, identifier: 1 }],
  });
  await dialog.dispatchEvent('touchend', {
    touches: [],
    changedTouches: [{ clientX: startX + dx, clientY: startY + dy, identifier: 1 }],
  });
}

test('swipe de 49px NÃO alterna; swipe de 50px alterna a seção', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  const dialog = await openNexus(page);
  const active = () => dialog.locator('[data-testid="nexus-active-section"]').first();

  const total = await dialog.locator('[data-section-kind]').count();
  test.skip(total < 2, 'Precisa de ≥ 2 seções para o teste.');

  const initialKind = await active().getAttribute('data-section-kind');

  // Logo abaixo do threshold: nada muda.
  await swipe(dialog, -49);
  await page.waitForTimeout(200);
  expect(await active().getAttribute('data-section-kind')).toBe(initialKind);

  // Exatamente no threshold: deve alternar.
  await swipe(dialog, -50);
  await expect
    .poll(async () => active().getAttribute('data-section-kind'), { timeout: 3000 })
    .not.toBe(initialKind);

  expect(errors).toEqual([]);
});
