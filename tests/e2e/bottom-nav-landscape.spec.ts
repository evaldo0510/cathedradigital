import { test, expect } from '@playwright/test';

test.describe('BottomNav Landscape Mobile Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Landscape viewport for mobile (iPhone 12/13/14 Pro style)
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/?lang=pt');
    await page.waitForLoadState('networkidle');
  });

  test('swiping left on Hoje in landscape should navigate to Bible', async ({ page }) => {
    // Check initial state
    const hojeItem = page.locator('button[aria-label="Hoje"]');
    await expect(hojeItem).toHaveAttribute('aria-current', 'page');

    // Perform swipe left
    // In landscape, we still want to swipe across a significant portion of the width
    await page.mouse.move(600, 200);
    await page.mouse.down();
    await page.mouse.move(200, 200, { steps: 20 });
    await page.mouse.up();

    // Wait for navigation
    await expect(page).toHaveURL(/\/bible/);
    
    // Verify Bible is active
    const bibleItem = page.locator('button[aria-label="Bíblia"]');
    await expect(bibleItem).toHaveAttribute('aria-current', 'page');
  });

  test('swiping right on Bible in landscape should navigate back to Hoje', async ({ page }) => {
    await page.goto('/bible?lang=pt');
    await page.waitForLoadState('networkidle');
    
    // Check Bible is active
    const bibleItem = page.locator('button[aria-label="Bíblia"]');
    await expect(bibleItem).toHaveAttribute('aria-current', 'page');

    // Perform swipe right
    await page.mouse.move(200, 200);
    await page.mouse.down();
    await page.mouse.move(600, 200, { steps: 20 });
    await page.mouse.up();

    // Wait for navigation
    await expect(page).toHaveURL(/\/|hoje/);
    
    // Verify Hoje is active
    const hojeItem = page.locator('button[aria-label="Hoje"]');
    await expect(hojeItem).toHaveAttribute('aria-current', 'page');
  });
});
