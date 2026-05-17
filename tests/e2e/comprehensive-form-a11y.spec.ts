import { test, expect } from '@playwright/test';

const ROUTES = ['/design-system', '/liturgia'];

test.describe('Comprehensive Form and Button Accessibility', () => {
  for (const route of ROUTES) {
    test(`keyboard navigation and focus visibility on ${route}`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      // Helper to check if the current active element has a visible focus indicator
      const checkFocusVisibility = async () => {
        return await page.evaluate(() => {
          const el = document.activeElement as HTMLElement;
          if (!el || el === document.body) return true; // Body focus is okay to skip
          const style = window.getComputedStyle(el);
          const hasRing = el.classList.contains('ring-2') || el.classList.contains('ring-primary') || el.classList.contains('focus:ring-2');
          const hasOutline = style.outlineStyle !== 'none' && style.outlineWidth !== '0px';
          const hasBoxShadow = style.boxShadow !== 'none' && style.boxShadow.includes('rgba');
          return hasRing || hasOutline || hasBoxShadow;
        });
      };

      // Press tab several times and verify each focusable element
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        const tagName = await page.evaluate(() => document.activeElement?.tagName);
        
        if (tagName === 'BUTTON' || tagName === 'INPUT' || tagName === 'SELECT' || tagName === 'A') {
          const isVisible = await checkFocusVisibility();
          expect(isVisible, `Element <${tagName}> at ${route} should have visible focus indicator`).toBe(true);
        }
      }
    });
  }

  test('Input and Select states on Design System Guide', async ({ page }) => {
    await page.goto('/design-system');

    // Test Disabled Input
    const disabledInput = page.locator('input[disabled]').first();
    await expect(disabledInput).toBeDisabled();
    await expect(disabledInput).toHaveAttribute('aria-disabled', 'true');

    // Test Error Input
    const errorInput = page.locator('.border-destructive').first();
    await expect(errorInput).toBeVisible();
    
    // Interact with Playground
    const playground = page.locator('text=Interactive Playground').locator('..');
    const errorBtn = page.getByRole('button', { name: 'Error' });
    await errorBtn.click();
    
    const playgroundInput = page.locator('input[placeholder="Interaja comigo"]');
    await expect(playgroundInput).toHaveClass(/border-destructive/);
    await expect(page.locator('text=Campo obrigatório.')).toBeVisible();

    const loadingBtn = page.getByRole('button', { name: 'Loading' });
    await loadingBtn.click();
    await expect(page.locator('.animate-spin')).toBeVisible();
  });
});
