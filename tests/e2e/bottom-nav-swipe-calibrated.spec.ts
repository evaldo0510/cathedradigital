import { test, expect } from '@playwright/test';

test.describe('BottomNav Calibrated Swipe', () => {
  test.use({ 
    viewport: { width: 390, height: 844 },
    hasTouch: true
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/?lang=pt');
    await page.waitForLoadState('networkidle');
  });

  /**
   * More robust swipe implementation using calibrated thresholds
   */
  async function performSwipe(page, startX, endX, y = 400) {
    await page.mouse.move(startX, y);
    await page.mouse.down();
    // Simulate a more realistic swipe with enough steps and duration
    await page.mouse.move(endX, y, { steps: 15 });
    // Small pause to ensure the swipe is registered before mouse up
    await page.waitForTimeout(50);
    await page.mouse.up();
  }

  test('robust swipe from Hoje to Bible', async ({ page }) => {
    const hojeItem = page.locator('button[aria-label="Hoje"]');
    await expect(hojeItem).toHaveAttribute('aria-current', 'page');

    // Swipe left (340 -> 50)
    await performSwipe(page, 340, 50);

    await expect(page).toHaveURL(/\/bible/);
    const bibleItem = page.locator('button[aria-label="Bíblia"]');
    await expect(bibleItem).toHaveAttribute('aria-current', 'page');
  });

  test('threshold check: swipe less than 100px should not trigger', async ({ page }) => {
    const hojeItem = page.locator('button[aria-label="Hoje"]');
    
    // Swipe left only 80px (300 -> 220)
    await performSwipe(page, 300, 220);

    await page.waitForTimeout(500);
    expect(page.url()).not.toContain('/bible');
    await expect(hojeItem).toHaveAttribute('aria-current', 'page');
  });

  test('swipe from Bible back to Hoje', async ({ page }) => {
    await page.goto('/bible?lang=pt');
    const bibleItem = page.locator('button[aria-label="Bíblia"]');
    await expect(bibleItem).toHaveAttribute('aria-current', 'page');

    // Swipe right (50 -> 340)
    await performSwipe(page, 50, 340);

    // Should go back to root or /hoje
    await expect(page).toHaveURL(/\/$/);
    const hojeItem = page.locator('button[aria-label="Hoje"]');
    await expect(hojeItem).toHaveAttribute('aria-current', 'page');
  });
});
