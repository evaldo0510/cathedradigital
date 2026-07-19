import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'mobile-portrait', width: 390, height: 844 },
  { name: 'mobile-landscape', width: 844, height: 390 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
];

const MASK = [
  '[data-testid="liturgy-text"]',
  '.liturgia-content',
  '.dynamic-date',
  '.dynamic-quote',
];

test.describe('Liturgia — regressão visual dark: hover / active / focus-visible (mobile + tablet)', () => {
  for (const vp of VIEWPORTS) {
    test(`estados interativos dark em ${vp.name}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: 'dark',
        hasTouch: true,
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      await page.addInitScript(() => {
        try {
          localStorage.setItem('theme', 'dark');
          localStorage.setItem('vite-ui-theme', 'dark');
        } catch {}
      });
      await page.goto('/liturgia');
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      });
      await page.waitForLoadState('networkidle');

      const tablist = page.getByRole('tablist', { name: /Navegação da Liturgia/i });
      await tablist.scrollIntoViewIfNeeded();
      const tabs = page.getByRole('tab');

      // Estado base: segunda aba ativa
      await tabs.nth(1).click();
      await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
      await page.waitForTimeout(150);

      // HOVER na primeira aba (inativa)
      await tabs.first().hover();
      await page.waitForTimeout(120);
      await expect(tablist).toHaveScreenshot(
        `liturgia-tablist-${vp.name}-dark-hover.png`,
        { maxDiffPixelRatio: 0.02, maxDiffPixels: 200, animations: 'disabled', mask: MASK.map((s) => page.locator(s)) },
      );

      // ACTIVE: pressiona e segura a primeira aba (mousedown sem soltar)
      const box = await tabs.first().boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(120);
        await expect(tablist).toHaveScreenshot(
          `liturgia-tablist-${vp.name}-dark-active.png`,
          { maxDiffPixelRatio: 0.02, maxDiffPixels: 200, animations: 'disabled', mask: MASK.map((s) => page.locator(s)) },
        );
        await page.mouse.up();
      }

      // FOCUS-VISIBLE via teclado na terceira aba (sem clicar)
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      await tabs.nth(2).focus();
      // Força focus-visible programaticamente (algumas engines exigem interação por teclado)
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');
      await page.waitForTimeout(120);
      await expect(tablist).toHaveScreenshot(
        `liturgia-tablist-${vp.name}-dark-focus-visible.png`,
        { maxDiffPixelRatio: 0.02, maxDiffPixels: 200, animations: 'disabled', mask: MASK.map((s) => page.locator(s)) },
      );

      await context.close();
    });
  }
});
