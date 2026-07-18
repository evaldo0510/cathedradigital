/**
 * CAT-030 — Threshold de swipe no Nexus (mobile).
 *
 * Confirma que gestos horizontais abaixo do threshold (~50px)
 * NÃO alternam as seções do painel.
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

test('swipe abaixo do threshold (~50px) não alterna a seção ativa', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  const dialog = await openNexus(page);
  const active = () => dialog.locator('[data-testid="nexus-active-section"]').first();

  const total = await dialog.locator('[data-section-kind]').count();
  test.skip(total < 2, 'Precisa de ≥ 2 seções para o teste.');

  const initialKind = await active().getAttribute('data-section-kind');

  // Vários swipes curtos, em ambas as direções, todos abaixo de 50px.
  for (const dx of [-10, -30, -49, 10, 30, 49]) {
    await swipe(dialog, dx);
    await page.waitForTimeout(150);
    const kind = await active().getAttribute('data-section-kind');
    expect(kind, `dx=${dx} não deveria alternar a seção`).toBe(initialKind);
  }

  expect(errors).toEqual([]);
});
