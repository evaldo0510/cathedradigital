import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Contemplative Mode Accessibility Audit', () => {
  test('Audit accessibility when contemplative mode is active', async ({ page }) => {
    await page.goto('/bible');
    await page.waitForLoadState('networkidle');

    // 1. Open Accessibility Panel
    await page.click('button[aria-label="Abrir configurações de acessibilidade"]');
    await expect(page.getByRole('dialog', { name: 'Acessibilidade' })).toBeVisible();

    // 2. Enable Contemplative Mode (via ReadingControlPanel if needed, or check if it's already on)
    // Actually, let's enable High Contrast and Visible Focus for testing
    await page.click('label:has-text("Alto Contraste")');
    await page.click('label:has-text("Foco Visível")');

    // 3. Run Axe Audit
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    // 4. Test Visible Focus
    await page.keyboard.press('Tab');
    const hasVisibleFocus = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return false;
      const style = window.getComputedStyle(el);
      return style.outlineStyle !== 'none' && parseInt(style.outlineWidth) >= 4;
    });
    expect(hasVisibleFocus).toBe(true);
  });
});
