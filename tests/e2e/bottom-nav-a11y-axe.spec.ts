import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('BottomNav Accessibility (Axe)', () => {
  test.use({ 
    viewport: { width: 390, height: 844 },
    hasTouch: true
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/?lang=pt');
    await injectAxe(page);
  });

  test('should have no accessibility violations in initial state', async ({ page }) => {
    // Focus specifically on the BottomNav
    await checkA11y(page, '.bottom-nav', {
      axeOptions: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']
        }
      }
    });
  });

  test('should have no violations when an item is active', async ({ page }) => {
    await page.click('button[aria-label="Bíblia"]');
    await expect(page).toHaveURL(/\/bible/);
    
    await checkA11y(page, '.bottom-nav', {
      axeOptions: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'best-practice']
        }
      }
    });
  });

  test('should have no violations during keyboard navigation', async ({ page }) => {
    await page.keyboard.press('Tab');
    // Tab until we reach the bottom nav (might take a few presses depending on page structure)
    // Or just focus it directly for the test
    const bibleItem = page.locator('button[aria-label="Bíblia"]');
    await bibleItem.focus();
    
    await checkA11y(page, '.bottom-nav', {
      axeOptions: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'best-practice']
        }
      }
    });
  });
});
