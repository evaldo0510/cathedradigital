import { test, expect } from '@playwright/test';

const TABS = [
  { id: 'liturgia', label: 'Liturgia' },
  { id: 'missal', label: 'Missal' },
  { id: 'calendario', label: 'Calendário' },
];

const MASK = [
  '[data-testid="liturgy-text"]',
  '.liturgia-content',
  '.dynamic-date',
  '.dynamic-quote',
];

test.describe('Liturgia — regressão visual das abas (desktop light)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const tab of TABS) {
    test(`snapshot da tablist com "${tab.label}" ativa`, async ({ page }) => {
      await page.goto('/liturgia');
      await page.waitForLoadState('networkidle');

      const tabs = page.getByRole('tab');
      const target = tabs.filter({ hasText: new RegExp(`^\\s*${tab.label}\\s*$`) }).first();
      await target.click();
      await expect(target).toHaveAttribute('aria-selected', 'true');
      await page.waitForTimeout(400); // aguarda scale/shadow

      const tablist = page.getByRole('tablist', { name: /Navegação da Liturgia/i });
      await expect(tablist).toBeVisible();
      await tablist.scrollIntoViewIfNeeded();

      await expect(tablist).toHaveScreenshot(`liturgia-tablist-${tab.id}-desktop.png`, {
        maxDiffPixelRatio: 0.02,
        maxDiffPixels: 150,
        animations: 'disabled',
        mask: MASK.map((s) => page.locator(s)),
      });
    });
  }
});
