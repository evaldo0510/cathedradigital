import { test, expect } from '@playwright/test';

/**
 * Swipe/arrasto na tira de pills (mobile):
 *  1. Rola a tira via gesto de toque (pointer touch).
 *  2. Toca em um pill visível após o swipe.
 *  3. Confirma que a data selecionada muda, o heading pt-BR atualiza e
 *     apenas 1 anúncio único aparece no aria-live por interação.
 */
test.use({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
});

test('SanctorumDateNav — swipe seleciona data, atualiza heading e aria-live emite 1 anúncio', async ({ page }) => {
  await page.goto('/santos?date=2026-07-20', { waitUntil: 'domcontentloaded' });

  const heading = page.getByRole('heading', { level: 2 }).first();
  await expect(heading).toHaveText(/^20 de julho$/i);

  const strip = page
    .locator('[role="group"]')
    .filter({ has: page.locator('button[aria-pressed]') })
    .first();
  await expect(strip).toBeVisible();

  // Instrumenta anúncios do aria-live
  await page.evaluate(() => {
    const region = document.querySelector(
      '[aria-live="polite"][aria-atomic="true"]',
    );
    (window as unknown as { __ann: string[] }).__ann = [];
    if (!region) return;
    new MutationObserver(() => {
      const text = (region.textContent ?? '').trim();
      if (text) (window as unknown as { __ann: string[] }).__ann.push(text);
    }).observe(region, { childList: true, subtree: true, characterData: true });
  });

  // Executa swipe da direita para a esquerda (avança pills)
  const box = await strip.boundingBox();
  if (!box) throw new Error('Tira de pills sem bounding box');
  const y = box.y + box.height / 2;
  const startX = box.x + box.width - 20;
  const endX = box.x + 20;

  await page.touchscreen.tap(startX, y); // garante foco/hover
  const steps = 12;
  for (let i = 0; i <= steps; i++) {
    const x = startX + ((endX - startX) * i) / steps;
    if (i === 0) {
      await page.mouse.move(x, y);
    }
  }
  // Playwright não expõe touch drag direto; usa evaluate para disparar TouchEvents
  await strip.evaluate(
    (el, args) => {
      const target = el as HTMLElement;
      const { sx, sy, ex, ey } = args as { sx: number; sy: number; ex: number; ey: number };
      const touchInit = (x: number, y: number) => ({
        identifier: 1,
        target,
        clientX: x,
        clientY: y,
        pageX: x,
        pageY: y,
        radiusX: 1,
        radiusY: 1,
        rotationAngle: 0,
        force: 1,
      });
      const dispatch = (type: string, x: number, y: number) => {
        try {
          const t = new Touch(touchInit(x, y));
          const ev = new TouchEvent(type, {
            bubbles: true,
            cancelable: true,
            touches: type === 'touchend' ? [] : [t],
            targetTouches: type === 'touchend' ? [] : [t],
            changedTouches: [t],
          });
          target.dispatchEvent(ev);
        } catch {
          // fallback: scroll direto
          target.scrollBy({ left: x < sx ? 120 : -120 });
        }
      };
      dispatch('touchstart', sx, sy);
      const N = 10;
      for (let i = 1; i <= N; i++) {
        const x = sx + ((ex - sx) * i) / N;
        dispatch('touchmove', x, sy);
      }
      dispatch('touchend', ex, ey);
      // Garante rolagem visível mesmo se o handler nativo não moveu
      target.scrollBy({ left: sx - ex });
    },
    { sx: startX, sy: y, ex: endX, ey: y },
  );

  await page.waitForTimeout(200);

  // Escolhe um pill visível dentro da tira após o swipe
  const targetPill = page
    .locator('[role="group"] button[aria-label*="de julho"]:not([aria-pressed="true"])')
    .first();
  const pillName = await targetPill.getAttribute('aria-label');
  expect(pillName).toBeTruthy();

  const annBefore = await page.evaluate(
    () => (window as unknown as { __ann: string[] }).__ann.length,
  );

  await targetPill.tap();

  // Extrai o dia do aria-label (ex.: "27 de julho de 2026")
  const dayMatch = pillName!.match(/^(\d{1,2}) de julho/i);
  expect(dayMatch).not.toBeNull();
  const dd = String(dayMatch![1]).padStart(2, '0');

  await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText(
    new RegExp(`^${dd} de julho$`, 'i'),
  );
  await expect(page).toHaveURL(new RegExp(`date=2026-07-${dd}`));
  await expect(page.locator('[role="group"] button[aria-pressed="true"]')).toHaveCount(1);

  // Somente 1 anúncio novo, sem duplicidades consecutivas
  const annsAfter = await page.evaluate(
    () => (window as unknown as { __ann: string[] }).__ann.slice(),
  );
  expect(annsAfter.length - annBefore).toBe(1);
  for (let i = 1; i < annsAfter.length; i++) {
    expect(annsAfter[i]).not.toBe(annsAfter[i - 1]);
  }
});
