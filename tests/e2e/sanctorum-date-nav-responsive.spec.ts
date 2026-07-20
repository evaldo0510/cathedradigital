import { test, expect, devices } from '@playwright/test';

/**
 * Compara o layout do SanctorumDateNav em mobile vs desktop
 * após a correção do date-fns (uso de `EEEEEE` p/ retornar sigla).
 *
 * Valida:
 *  - Tira renderiza 7 pills com siglas curtas (≤ 3 chars).
 *  - Nenhuma pill "estoura" — todas cabem no viewport horizontal com scroll.
 *  - Screenshots comparativos ficam em test-results/sanctorum-date-nav/.
 */

const PATHS = ['/santos?date=2026-07-20', '/papas'];

for (const path of PATHS) {
  test.describe(`SanctorumDateNav layout — ${path}`, () => {
    test(`mobile (iPhone SE) — pills cabem sem quebrar`, async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone SE'],
      });
      const page = await context.newPage();
      await page.goto(path, { waitUntil: 'domcontentloaded' });

      const strip = page.getByTestId('sanctorum-date-strip');
      await strip.waitFor({ state: 'visible', timeout: 15000 });

      const pills = strip.locator('button');
      await expect(pills).toHaveCount(7);

      // Todas as siglas ≤ 3 chars
      const abbrs = await pills.locator('span').first().allTextContents();
      for (const abbr of abbrs) {
        expect(abbr.trim().length).toBeLessThanOrEqual(3);
      }

      // Nenhuma pill maior que o max-w garantido
      const widths = await pills.evaluateAll((els) =>
        els.map((el) => (el as HTMLElement).getBoundingClientRect().width),
      );
      for (const w of widths) {
        expect(w).toBeGreaterThanOrEqual(56);
        expect(w).toBeLessThanOrEqual(80);
      }

      // A tira não pode transbordar o viewport na altura (quebra de linha)
      const box = await strip.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeLessThan(100);

      await strip.screenshot({
        path: `test-results/sanctorum-date-nav/mobile-${path.replace(/[/?=&]/g, '_')}.png`,
      });

      await context.close();
    });

    test(`desktop (1280×800) — layout confortável`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
      });
      const page = await context.newPage();
      await page.goto(path, { waitUntil: 'domcontentloaded' });

      const strip = page.getByTestId('sanctorum-date-strip');
      await strip.waitFor({ state: 'visible', timeout: 15000 });

      const pills = strip.locator('button');
      await expect(pills).toHaveCount(7);

      const abbrs = await pills.locator('span').first().allTextContents();
      for (const abbr of abbrs) {
        expect(abbr.trim().length).toBeLessThanOrEqual(3);
      }

      const box = await strip.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeLessThan(120);

      await strip.screenshot({
        path: `test-results/sanctorum-date-nav/desktop-${path.replace(/[/?=&]/g, '_')}.png`,
      });

      await context.close();
    });
  });
}
