import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('BottomNav Accessibility (Axe)', () => {
  test.use({ 
    viewport: { width: 390, height: 844 },
    hasTouch: true
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/?lang=pt');
  });

  test('should have no accessibility violations in initial state', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('.bottom-nav')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have no violations when an item is active', async ({ page }) => {
    await page.click('button[aria-label="Bíblia"]');
    await expect(page).toHaveURL(/\/bible/);
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('.bottom-nav')
      .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have no violations during keyboard navigation', async ({ page }) => {
    const bibleItem = page.locator('button[aria-label="Bíblia"]');
    await bibleItem.focus();
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('.bottom-nav')
      .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
