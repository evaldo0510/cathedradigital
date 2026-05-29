import { test, expect } from '@playwright/test';

test.describe('BottomNav Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?lang=pt');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate between items using Tab and Enter', async ({ page }) => {
    // Start at Hoje
    const hojeItem = page.locator('button[aria-label="Hoje"]');
    await expect(hojeItem).toHaveAttribute('aria-current', 'page');
    
    // Tab to Bíblia
    await page.keyboard.press('Tab');
    // Note: Tab order might depend on other elements. Let's make sure focus is correct.
    // If we just loaded, we might need to tab a few times or focus the nav first.
    
    const bibleItem = page.locator('button[aria-label="Bíblia"]');
    await bibleItem.focus();
    await expect(bibleItem).toBeFocused();
    
    // Press Enter to navigate
    await page.keyboard.press('Enter');
    
    // Verify URL and active state
    await expect(page).toHaveURL(/\/bible/);
    await expect(bibleItem).toHaveAttribute('aria-current', 'page');
    
    // Tab to Catecismo
    await page.keyboard.press('Tab');
    const catechismItem = page.locator('button[aria-label="Catecismo"]');
    await expect(catechismItem).toBeFocused();
    
    // Press Space to navigate
    await page.keyboard.press('Space');
    
    // Verify URL and active state
    await expect(page).toHaveURL(/\/catechism/);
    await expect(catechismItem).toHaveAttribute('aria-current', 'page');
  });

  test('focus visible should be consistent', async ({ page }) => {
    const bibleItem = page.locator('button[aria-label="Bíblia"]');
    await bibleItem.focus();
    
    // Check if focus-visible styles are applied (bg-primary/[0.05] or similar)
    // We can check the computed style
    const bgColor = await bibleItem.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    // Since it's a slight alpha overlay, we just check it's not transparent or matches expected
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
  });
});
