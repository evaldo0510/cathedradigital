import { test, expect } from '@playwright/test';
import { watchPopups, assertParagraphVisible } from './utils/bible-cic-helpers';

/**
 * Catecismo permanece funcional/legível em mobile e desktop.
 * Sem popup, sem nova aba, controles de § visíveis e clicáveis.
 */
const VIEWPORTS = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'desktop-1280', width: 1280, height: 900 },
];

for (const vp of VIEWPORTS) {
  test.describe(`catechism responsivo [${vp.name}]`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test(`controles § funcionam sem regressão`, async ({ context, page }) => {
      const popups = watchPopups(context, page);
      const pagesBefore = context.pages().length;

      await page.goto('/catechism?p=2');
      await page.waitForLoadState('domcontentloaded');

      // Landmarks e legibilidade básica
      await expect(page.locator('main').first()).toBeVisible();
      await assertParagraphVisible(page, '2');

      // Font-size mínimo de leitura no <main> (evita regressão de tipografia)
      const fontPx = await page.locator('main').first().evaluate(
        (el) => parseFloat(getComputedStyle(el).fontSize),
      );
      expect(fontPx).toBeGreaterThanOrEqual(12);

      // Se houver controles de próxima/anterior de seção, precisam estar visíveis
      const nextBtn = page.locator('[data-testid="catechism-section-next"]');
      if (await nextBtn.count()) {
        await expect(nextBtn.first()).toBeVisible();
        const box = await nextBtn.first().boundingBox();
        expect(box?.width || 0).toBeGreaterThan(0);
      }

      expect(popups).toEqual([]);
      expect(context.pages().length).toBe(pagesBefore);
    });
  });
}
