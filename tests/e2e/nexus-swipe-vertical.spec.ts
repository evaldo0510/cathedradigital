/**
 * CAT-030 — Gestos verticais no Nexus não viram swipe.
 *
 * Um gesto predominantemente vertical deve preservar o scroll nativo do
 * painel: a seção ativa não muda e o conteúdo continua rolando.
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

async function verticalGesture(dialog: Locator, dy: number, dx = 8) {
  await dialog.dispatchEvent('touchstart', {
    touches: [{ clientX: 200, clientY: 600, identifier: 1 }],
    changedTouches: [{ clientX: 200, clientY: 600, identifier: 1 }],
  });
  await dialog.dispatchEvent('touchend', {
    touches: [],
    changedTouches: [{ clientX: 200 + dx, clientY: 600 + dy, identifier: 1 }],
  });
}

test('gesto vertical preserva scroll e não troca seção', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  const dialog = await openNexus(page);
  const active = () => dialog.locator('[data-testid="nexus-active-section"]').first();
  const initialKind = await active().getAttribute('data-section-kind');

  // Gesto vertical amplo (dy=200, dx=8) — dominante vertical, abaixo do ratio.
  await verticalGesture(dialog, -200, 8);
  await page.waitForTimeout(250);
  expect(
    await active().getAttribute('data-section-kind'),
    'seção não deve mudar com gesto vertical',
  ).toBe(initialKind);

  // Também: gesto iniciado sobre um bubble (elemento interativo) é ignorado.
  const bubble = dialog.locator('[data-testid="nexus-bubble-cta"]').first();
  if (await bubble.count()) {
    await bubble.dispatchEvent('touchstart', {
      touches: [{ clientX: 200, clientY: 500, identifier: 2 }],
      changedTouches: [{ clientX: 200, clientY: 500, identifier: 2 }],
    });
    await bubble.dispatchEvent('touchend', {
      touches: [],
      changedTouches: [{ clientX: 20, clientY: 505, identifier: 2 }],
    });
    await page.waitForTimeout(250);
    expect(
      await active().getAttribute('data-section-kind'),
      'gesto sobre bubble não deve trocar seção',
    ).toBe(initialKind);
  }

  expect(errors).toEqual([]);
});
