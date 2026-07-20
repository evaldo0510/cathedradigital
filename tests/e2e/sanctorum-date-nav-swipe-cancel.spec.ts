import { test, expect } from '@playwright/test';

/**
 * Swipe curto ou cancelado (touchcancel) NÃO pode:
 *  - mudar data / heading
 *  - alterar seleção
 *  - gerar anúncios duplicados no aria-live
 */
test.use({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
});

async function touchGesture(
  page: import('@playwright/test').Page,
  opts: { dx: number; cancel?: boolean },
) {
  const strip = page
    .locator('[role="group"]')
    .filter({ has: page.locator('button[aria-pressed]') })
    .first();
  const box = await strip.boundingBox();
  if (!box) throw new Error('no box');
  const sx = box.x + box.width / 2;
  const sy = box.y + box.height / 2;
  const ex = sx + opts.dx;
  await strip.evaluate(
    (el, args) => {
      const { sx, sy, ex, ey, cancel } = args as {
        sx: number; sy: number; ex: number; ey: number; cancel: boolean;
      };
      const target = el as HTMLElement;
      const dispatch = (type: string, x: number, y: number, empty = false) => {
        try {
          const t = new Touch({
            identifier: 1, target, clientX: x, clientY: y,
            radiusX: 1, radiusY: 1, rotationAngle: 0, force: 1,
          });
          target.dispatchEvent(new TouchEvent(type, {
            bubbles: true, cancelable: true,
            touches: empty ? [] : [t],
            targetTouches: empty ? [] : [t],
            changedTouches: [t],
          }));
        } catch { /* noop */ }
      };
      dispatch('touchstart', sx, sy);
      dispatch('touchmove', (sx + ex) / 2, sy);
      dispatch('touchmove', ex, sy);
      if (cancel) dispatch('touchcancel', ex, ey, true);
      else dispatch('touchend', ex, ey, true);
    },
    { sx, sy, ex, ey: sy, cancel: !!opts.cancel },
  );
  await page.waitForTimeout(150);
}

test('SanctorumDateNav — swipe curto/cancelado não altera data nem aria-live', async ({ page }) => {
  await page.goto('/santos?date=2026-07-20', { waitUntil: 'domcontentloaded' });
  const heading = page.getByRole('heading', { level: 2 }).first();
  await expect(heading).toHaveText(/^20 de julho$/i);

  const strip = page
    .locator('[role="group"]')
    .filter({ has: page.locator('button[aria-pressed]') })
    .first();
  const initialSelected = await strip
    .locator('button[aria-pressed="true"]')
    .first()
    .getAttribute('aria-label');

  await page.evaluate(() => {
    const region = document.querySelector('[aria-live="polite"][aria-atomic="true"]');
    (window as unknown as { __a: string[] }).__a = [];
    if (!region) return;
    new MutationObserver(() => {
      const t = (region.textContent ?? '').trim();
      if (t) (window as unknown as { __a: string[] }).__a.push(t);
    }).observe(region, { childList: true, subtree: true, characterData: true });
  });
  await page.waitForTimeout(100);
  const baseline = await page.evaluate(
    () => (window as unknown as { __a: string[] }).__a.length,
  );

  // 1) Swipe curto (poucos pixels)
  await touchGesture(page, { dx: -8 });
  await touchGesture(page, { dx: 6 });
  // 2) Swipe cancelado
  await touchGesture(page, { dx: -80, cancel: true });
  await touchGesture(page, { dx: 60, cancel: true });

  // Estado intacto
  await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText(/^20 de julho$/i);
  await expect(page).toHaveURL(/date=2026-07-20/);
  await expect(strip.locator('button[aria-pressed="true"]')).toHaveCount(1);
  await expect(strip.locator('button[aria-pressed="true"]').first()).toHaveAttribute(
    'aria-label',
    initialSelected!,
  );

  // aria-live: nenhum anúncio novo além do baseline; sem duplicidades
  const anns = await page.evaluate(
    () => (window as unknown as { __a: string[] }).__a.slice(),
  );
  expect(anns.length).toBe(baseline);
  for (let i = 1; i < anns.length; i++) {
    expect(anns[i]).not.toBe(anns[i - 1]);
  }
});
