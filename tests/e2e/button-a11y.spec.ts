import { test, expect } from '@playwright/test';

test.describe('Button Keyboard Navigation and States', () => {
  test('should be focusable via keyboard', async ({ page }) => {
    await page.goto('/design-system');
    
    // Tab through buttons
    await page.keyboard.press('Tab');
    
    // Check if any button has focus and a visible ring
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'A']).toContain(focusedElement);
    
    // Check for focus ring class or outline
    const hasVisibleFocus = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const style = window.getComputedStyle(el);
      return style.outlineStyle !== 'none' || style.boxShadow !== 'none' || el.classList.contains('ring-2') || el.classList.contains('ring-primary');
    });
    expect(hasVisibleFocus).toBe(true);
  });

  test('should handle disabled state correctly', async ({ page }) => {
    await page.goto('/design-system');
    const disabledButton = page.locator('button:has-text("Disabled Primary")');
    await expect(disabledButton).toBeDisabled();
    await expect(disabledButton).toHaveAttribute('aria-disabled', 'true');
    
    // Should not be focusable via tab
    await page.focus('body');
    let found = false;
    for (let i = 0; i < 50; i++) {
      await page.keyboard.press('Tab');
      const text = await page.evaluate(() => document.activeElement?.textContent);
      if (text === 'Disabled Primary') {
        found = true;
        break;
      }
    }
    expect(found).toBe(false);
  });

  test('should handle loading state correctly', async ({ page }) => {
    await page.goto('/design-system');
    const loadingButton = page.locator('button:has-text("Loading Primary")');
    await expect(loadingButton).toHaveAttribute('aria-busy', 'true');
    await expect(loadingButton).toHaveAttribute('aria-disabled', 'true');
    
    // Check if spinner exists
    const spinner = loadingButton.locator('.animate-spin');
    await expect(spinner).toBeVisible();
  });
});
