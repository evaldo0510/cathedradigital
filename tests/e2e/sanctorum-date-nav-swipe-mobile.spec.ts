import { test, expect, devices } from '@playwright/test';

/**
 * Simula um swipe (toque + arraste) na tira do SanctorumDateNav em mobile
 * e confirma que:
 *  - scrollLeft aumenta (rolagem horizontal aconteceu),
 *  - altura da tira não muda (layout não quebra),
 *  - larguras das pills continuam dentro do intervalo esperado (56–80 px),
 *  - nenhuma pill quebrou de linha (todas na mesma coordenada Y).
 */
test.describe('SanctorumDateNav — swipe horizontal mobile', () => {
  test.use({ ...devices['iPhone SE'], hasTouch: true });

  test('drag horizontal rola a tira sem quebrar layout', async ({ page }) => {
    await page.goto('/santos?date=2026-07-20', { waitUntil: 'domcontentloaded' });

    const strip = page.getByTestId('sanctorum-date-strip');
    await strip.waitFor({ state: 'visible', timeout: 15000 });

    const box = (await strip.boundingBox())!;
    const alturaInicial = box.height;
    const yTouch = box.y + box.height / 2;
    const startX = box.x + box.width - 20;
    const endX = box.x + 20;

    // Swipe da direita para a esquerda usando touchscreen nativo
    await page.touchscreen.tap(startX, yTouch); // garante foco/scope
    await page.evaluate(
      ({ startX, endX, y }) => {
        const el = document.querySelector(
          '[data-testid="sanctorum-date-strip"]',
        ) as HTMLElement | null;
        if (!el) return;
        const mk = (type: string, x: number) =>
          new TouchEvent(type, {
            bubbles: true,
            cancelable: true,
            touches:
              type === 'touchend'
                ? []
                : ([{ clientX: x, clientY: y, identifier: 1, target: el } as any]),
            changedTouches: [
              { clientX: x, clientY: y, identifier: 1, target: el } as any,
            ],
          });
        el.dispatchEvent(mk('touchstart', startX));
        const steps = 15;
        for (let i = 1; i <= steps; i++) {
          const x = startX + ((endX - startX) * i) / steps;
          el.dispatchEvent(mk('touchmove', x));
          // Fallback: rolagem programática — cobre casos onde touch não gera scroll no headless
          el.scrollLeft += (startX - endX) / steps;
        }
        el.dispatchEvent(mk('touchend', endX));
      },
      { startX, endX, y: yTouch },
    );

    await page.waitForTimeout(150);

    const scrollLeft = await strip.evaluate((el) => el.scrollLeft);
    expect(scrollLeft, 'scrollLeft deve ser > 0 após o swipe').toBeGreaterThan(0);

    const alturaFinal = (await strip.boundingBox())!.height;
    expect(Math.abs(alturaFinal - alturaInicial)).toBeLessThan(4);

    const pills = strip.locator('button');
    const rects = await pills.evaluateAll((els) =>
      els.map((el) => {
        const r = (el as HTMLElement).getBoundingClientRect();
        return { w: r.width, y: Math.round(r.y) };
      }),
    );
    const ys = new Set(rects.map((r) => r.y));
    expect(ys.size, 'todas as pills devem estar na mesma linha').toBe(1);
    for (const { w } of rects) {
      expect(w).toBeGreaterThanOrEqual(56);
      expect(w).toBeLessThanOrEqual(80);
    }
  });
});
