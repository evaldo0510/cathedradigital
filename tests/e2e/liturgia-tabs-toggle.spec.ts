import { test, expect, devices } from '@playwright/test';

const TABS = [
  { id: 'liturgia', label: 'Liturgia' },
  { id: 'missal', label: 'Missal' },
  { id: 'calendario', label: 'Calendário' },
];

test.describe('Liturgia — toque/clique alterna aba (sem overflow)', () => {
  test('desktop click alterna aria-selected sem overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/liturgia');
    await page.waitForLoadState('networkidle');

    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(TABS.length);

    for (let i = 0; i < TABS.length; i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(150);
      await expect(tabs.nth(i)).toHaveAttribute('aria-selected', 'true');
      for (let j = 0; j < TABS.length; j++) {
        if (j === i) continue;
        await expect(tabs.nth(j)).toHaveAttribute('aria-selected', 'false');
      }
      const hOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hOverflow, `overflow após clicar em ${TABS[i].label}`).toBe(false);
    }
  });

  test('mobile touch (tap) alterna aria-selected sem overflow', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/liturgia');
    await page.waitForLoadState('networkidle');

    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(TABS.length);

    for (let i = 0; i < TABS.length; i++) {
      await tabs.nth(i).tap();
      await page.waitForTimeout(150);
      await expect(tabs.nth(i)).toHaveAttribute('aria-selected', 'true');
      for (let j = 0; j < TABS.length; j++) {
        if (j === i) continue;
        await expect(tabs.nth(j)).toHaveAttribute('aria-selected', 'false');
      }
      const hOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hOverflow, `overflow após tap em ${TABS[i].label}`).toBe(false);
    }

    await context.close();
  });
});
