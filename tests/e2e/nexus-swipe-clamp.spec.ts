/**
 * CAT-030 — Clamp de swipe nas bordas do Nexus.
 *
 * Garante que swipes adicionais na primeira/última seção não geram estados
 * inconsistentes: o índice permanece nos limites e o painel segue interativo.
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
  await dialog.dispatchEvent('touchstart', {
    touches: [{ clientX: 320, clientY: 500, identifier: 1 }],
    changedTouches: [{ clientX: 320, clientY: 500, identifier: 1 }],
  });
  await dialog.dispatchEvent('touchend', {
    touches: [],
    changedTouches: [{ clientX: 320 + dx, clientY: 500, identifier: 1 }],
  });
}

test('clamp mantém primeira/última seção estáveis sob swipes extras', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  const dialog = await openNexus(page);
  const active = () => dialog.locator('[data-testid="nexus-active-section"]').first();

  const total = await dialog.locator('[data-section-kind]').count();
  test.skip(total < 2, 'Precisa de ≥ 2 seções para testar clamp.');

  // Primeira seção — tenta voltar 3x, deve permanecer.
  const firstKind = await active().getAttribute('data-section-kind');
  for (let i = 0; i < 3; i++) await swipe(dialog, 180);
  await page.waitForTimeout(300);
  expect(await active().getAttribute('data-section-kind')).toBe(firstKind);

  // Avança até a última seção com Alt+→.
  await dialog.focus();
  for (let i = 0; i < total - 1; i++) {
    await page.keyboard.press('Alt+ArrowRight');
    await page.waitForTimeout(120);
  }
  const lastKind = await active().getAttribute('data-section-kind');
  expect(lastKind).not.toBe(firstKind);

  // Última seção — tenta avançar 3x, deve permanecer.
  for (let i = 0; i < 3; i++) await swipe(dialog, -180);
  await page.waitForTimeout(300);
  expect(await active().getAttribute('data-section-kind')).toBe(lastKind);

  // Painel continua interativo: botão fechar responde.
  const closeBtn = dialog.locator('button[aria-label*="ech" i], button:has-text("Fechar")').first();
  if (await closeBtn.count()) {
    await closeBtn.click();
    await expect(dialog).toBeHidden({ timeout: 3000 });
  }

  expect(errors).toEqual([]);
});
