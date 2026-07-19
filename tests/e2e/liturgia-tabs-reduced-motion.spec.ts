import { test, expect } from '@playwright/test';

test.describe('Liturgia — prefers-reduced-motion (sem flicker/layout shift)', () => {
  test.use({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });

  test('animações respeitam reduced motion e tablist não sofre layout shift', async ({ page }) => {
    await page.goto('/liturgia');
    await page.waitForLoadState('networkidle');

    const tablist = page.getByRole('tablist', { name: /Navegação da Liturgia/i });
    await expect(tablist).toBeVisible();
    await tablist.scrollIntoViewIfNeeded();

    // matchMedia confirma reduced-motion ativo
    const prefersReduced = await page.evaluate(
      () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    expect(prefersReduced, 'prefers-reduced-motion deve estar ativo').toBe(true);

    const tabs = page.getByRole('tab');
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Verifica que transições foram neutralizadas nas abas
    for (let i = 0; i < count; i++) {
      const durations = await tabs.nth(i).evaluate((el) => {
        const cs = getComputedStyle(el);
        const parse = (v: string) =>
          v.split(',').map((s) => parseFloat(s.trim()) || 0);
        return {
          transition: parse(cs.transitionDuration),
          animation: parse(cs.animationDuration),
        };
      });
      const maxT = Math.max(...durations.transition, 0);
      const maxA = Math.max(...durations.animation, 0);
      // Sob reduced-motion, animações devem ser desprezíveis (≤ 0.05s)
      expect(maxT, `aba ${i} transition-duration sob reduced-motion`).toBeLessThanOrEqual(0.05);
      expect(maxA, `aba ${i} animation-duration sob reduced-motion`).toBeLessThanOrEqual(0.05);
    }

    // Instrumenta CLS na região da tablist
    await page.evaluate(() => {
      (window as any).__cls = 0;
      const po = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // @ts-ignore
          if (!entry.hadRecentInput) (window as any).__cls += (entry as any).value;
        }
      });
      po.observe({ type: 'layout-shift', buffered: true });
    });

    // Mede bounding box antes/depois de alternar cada aba (sem flicker/shift)
    const boxes: Array<{ x: number; y: number; w: number; h: number }> = [];
    for (let i = 0; i < count; i++) {
      const box = await tablist.boundingBox();
      if (box) boxes.push({ x: box.x, y: box.y, w: box.width, h: box.height });
      await tabs.nth(i).click();
      await expect(tabs.nth(i)).toHaveAttribute('aria-selected', 'true');
      await page.waitForTimeout(120);
    }

    // Tolerância de 1px para sub-pixel; tablist não pode deslocar
    for (let i = 1; i < boxes.length; i++) {
      expect(Math.abs(boxes[i].x - boxes[0].x)).toBeLessThanOrEqual(1);
      expect(Math.abs(boxes[i].y - boxes[0].y)).toBeLessThanOrEqual(1);
      expect(Math.abs(boxes[i].w - boxes[0].w)).toBeLessThanOrEqual(1);
      expect(Math.abs(boxes[i].h - boxes[0].h)).toBeLessThanOrEqual(1);
    }

    const cls = await page.evaluate(() => (window as any).__cls || 0);
    expect(cls, `CLS acumulado ao alternar abas = ${cls}`).toBeLessThan(0.05);
  });
});
