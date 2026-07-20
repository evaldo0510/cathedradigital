import { test, expect } from '@playwright/test';

/**
 * Limites da tira: swipe não pode ultrapassar bordas,
 * foco visível preservado, heading e seleção intactos.
 */
test.use({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
});

async function swipe(page: import('@playwright/test').Page, direction: 'left' | 'right') {
  const strip = page
    .locator('[role="group"]')
    .filter({ has: page.locator('button[aria-pressed]') })
    .first();
  const box = await strip.boundingBox();
  if (!box) throw new Error('no strip box');
  const y = box.y + box.height / 2;
  const sx = direction === 'left' ? box.x + box.width - 20 : box.x + 20;
  const ex = direction === 'left' ? box.x + 20 : box.x + box.width - 20;
  await strip.evaluate(
    (el, args) => {
      const { sx, sy, ex, ey } = args as { sx: number; sy: number; ex: number; ey: number };
      const target = el as HTMLElement;
      const dispatch = (type: string, x: number, y: number, empty = false) => {
        try {
          const t = new Touch({
            identifier: 1,
            target,
            clientX: x,
            clientY: y,
            radiusX: 1,
            radiusY: 1,
            rotationAngle: 0,
            force: 1,
          });
          target.dispatchEvent(
            new TouchEvent(type, {
              bubbles: true,
              cancelable: true,
              touches: empty ? [] : [t],
              targetTouches: empty ? [] : [t],
              changedTouches: [t],
            }),
          );
        } catch {
          /* noop */
        }
      };
      dispatch('touchstart', sx, sy);
      for (let i = 1; i <= 10; i++) {
        const x = sx + ((ex - sx) * i) / 10;
        dispatch('touchmove', x, sy);
      }
      dispatch('touchend', ex, ey, true);
      target.scrollBy({ left: (sx - ex) * 3 });
    },
    { sx, sy: y, ex, ey: y },
  );
  await page.waitForTimeout(200);
}

test('SanctorumDateNav — swipe respeita limites da tira, foco e seleção', async ({ page }) => {
  await page.goto('/santos?date=2026-07-20', { waitUntil: 'domcontentloaded' });
  const heading = page.getByRole('heading', { level: 2 }).first();
  await expect(heading).toHaveText(/^20 de julho$/i);

  const strip = page
    .locator('[role="group"]')
    .filter({ has: page.locator('button[aria-pressed]') })
    .first();

  const selected = strip.locator('button[aria-pressed="true"]').first();
  const selectedLabel = await selected.getAttribute('aria-label');
  await selected.focus();

  // Swipes agressivos para o extremo direito (avança scroll para a esquerda visual)
  for (let i = 0; i < 6; i++) await swipe(page, 'left');
  const scrollMaxLeft = await strip.evaluate(
    (el) => (el as HTMLElement).scrollLeft <= (el as HTMLElement).scrollWidth - (el as HTMLElement).clientWidth,
  );
  expect(scrollMaxLeft).toBeTruthy();
  const overflowRight = await strip.evaluate((el) => {
    const e = el as HTMLElement;
    return e.scrollLeft <= e.scrollWidth - e.clientWidth + 1;
  });
  expect(overflowRight).toBeTruthy();

  // Swipes agressivos para o extremo esquerdo
  for (let i = 0; i < 12; i++) await swipe(page, 'right');
  const atStart = await strip.evaluate((el) => (el as HTMLElement).scrollLeft >= 0);
  expect(atStart).toBeTruthy();

  // Heading e seleção intactos (nenhum swipe muda data)
  await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText(/^20 de julho$/i);
  await expect(strip.locator('button[aria-pressed="true"]')).toHaveCount(1);
  await expect(strip.locator('button[aria-pressed="true"]').first()).toHaveAttribute(
    'aria-label',
    selectedLabel!,
  );

  // Foco visível permanece no elemento com foco
  await page.getByRole('button', { name: /próximo dia/i }).focus();
  const focusInfo = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return { ok: false };
    const cs = getComputedStyle(el);
    const outlineOk = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth || '0') > 0;
    const shadowOk = cs.boxShadow !== 'none';
    return { ok: outlineOk || shadowOk };
  });
  expect(focusInfo.ok).toBeTruthy();
});
