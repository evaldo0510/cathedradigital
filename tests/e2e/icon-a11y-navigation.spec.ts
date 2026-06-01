import { test, expect } from '@playwright/test';

test.describe('Icon Accessibility and Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have visible focus indicators on interactive icons', async ({ page }) => {
    // Focus the first interactive element (usually a button in the header or sidebar)
    await page.keyboard.press('Tab');
    
    // Check if the focused element has a visible outline or ring
    const focusedElement = await page.evaluateHandle(() => document.activeElement);
    const hasFocusStyles = await page.evaluate((el) => {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      return style.outlineStyle !== 'none' || style.boxShadow.includes('ring') || style.outlineWidth !== '0px';
    }, focusedElement);

    // Some components might use custom focus rings via Tailwind 'ring'
    expect(hasFocusStyles).toBe(true);
  });

  test('should follow a logical focus order', async ({ page }) => {
    // This is a simplified check. In a real scenario, we'd map out the expected order.
    // For now, we'll verify that Tabbing moves focus between interactive elements.
    const interactiveElements = await page.locator('button, a, [role="button"], input, select').count();
    
    let previousText = '';
    for (let i = 0; i < Math.min(interactiveElements, 10); i++) {
      await page.keyboard.press('Tab');
      const currentElement = await page.evaluate(() => document.activeElement?.textContent || '');
      expect(currentElement).not.toBe(previousText); // Focus should move
      previousText = currentElement;
    }
  });

  test('should have aria-labels or aria-hidden on all icons', async ({ page }) => {
    const icons = page.locator('svg');
    const iconCount = await icons.count();

    for (let i = 0; i < iconCount; i++) {
      const icon = icons.nth(i);
      const isHidden = await icon.getAttribute('aria-hidden');
      const label = await icon.getAttribute('aria-label');
      const role = await icon.getAttribute('role');

      // Every icon should either be hidden from screen readers or have a label
      if (isHidden !== 'true') {
        expect(label || role === 'img').toBeTruthy();
      }
    }
  });

  test('should support Shift+Tab to move backwards', async ({ page }) => {
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const element2 = await page.evaluate(() => document.activeElement);
    
    await page.keyboard.press('Shift+Tab');
    const element1 = await page.evaluate(() => document.activeElement);
    
    expect(element1).not.toBe(element2);
  });
});
