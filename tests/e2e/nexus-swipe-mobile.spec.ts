/**
 * CAT-030 — Swipe horizontal no Nexus (mobile).
 *
 * Valida que gestos horizontais alternam as seções narrativas do painel
 * sem gerar dead-ends nem erros de console.
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

test('swipe-left/right alterna seções sem dead-ends e sem console.error', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  const dialog = await openNexus(page);
  const active = () => dialog.locator('[data-testid="nexus-active-section"]').first();

  const total = await dialog.locator('[data-section-kind]').count();
  test.skip(total < 2, 'Precisa de ≥ 2 seções para alternar.');

  const initialKind = await active().getAttribute('data-section-kind');

  // Swipe-left → próxima seção.
  await swipe(dialog, -180);
  await expect
    .poll(async () => active().getAttribute('data-section-kind'), { timeout: 3000 })
    .not.toBe(initialKind);
  const nextKind = await active().getAttribute('data-section-kind');

  // Swipe-right → volta.
  await swipe(dialog, 180);
  await expect
    .poll(async () => active().getAttribute('data-section-kind'), { timeout: 3000 })
    .toBe(initialKind);
  expect(nextKind).not.toBe(initialKind);

  // Nenhum bubble marcado como desabilitado (dead-end).
  const disabled = await dialog.locator('[aria-disabled="true"]').count();
  expect(disabled).toBe(0);

  expect(errors).toEqual([]);
});
