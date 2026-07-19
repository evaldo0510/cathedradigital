import { test, expect } from '@playwright/test';

const TABS = [
  { id: 'liturgia', label: 'Liturgia' },
  { id: 'missal', label: 'Missal' },
  { id: 'calendario', label: 'Calendário' },
];

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

test.describe('Liturgia — regressão visual em DARK (mobile + tablet, portrait + landscape)', () => {
  for (const vp of VIEWPORTS) {
    for (const tab of TABS) {
      test(`snapshot dark ${vp.name} — "${tab.label}" ativa`, async ({ browser }) => {
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

        const tabs = page.getByRole('tab');
        const target = tabs.filter({ hasText: new RegExp(`^\\s*${tab.label}\\s*$`) }).first();
        await target.click();
        await expect(target).toHaveAttribute('aria-selected', 'true');
        await page.waitForTimeout(300);

        const tablist = page.getByRole('tablist', { name: /Navegação da Liturgia/i });
        await expect(tablist).toBeVisible();
        await tablist.scrollIntoViewIfNeeded();

        await expect(tablist).toHaveScreenshot(
          `liturgia-tablist-${tab.id}-${vp.name}-dark.png`,
          {
            maxDiffPixelRatio: 0.02,
            maxDiffPixels: 200,
            animations: 'disabled',
            mask: MASK.map((s) => page.locator(s)),
          },
        );

        await context.close();
      });
    }
  }
});
