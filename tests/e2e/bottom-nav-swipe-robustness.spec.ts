import { test, expect } from '@playwright/test';

test.describe('BottomNav Swipe Robustness', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?lang=pt');
    await page.waitForLoadState('networkidle');
  });

  test('short drags should not trigger navigation', async ({ page }) => {
    const hojeItem = page.locator('button[aria-label="Hoje"]');
    await expect(hojeItem).toHaveAttribute('aria-current', 'page');

    // Perform a short swipe left (less than 100px threshold)
    await page.mouse.move(300, 400);
    await page.mouse.down();
    await page.mouse.move(250, 400, { steps: 10 });
    await page.mouse.up();

    // URL should NOT change
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain('/bible');
    await expect(hojeItem).toHaveAttribute('aria-current', 'page');
  });

  test('irregular drags (mostly vertical) should not trigger navigation', async ({ page }) => {
    const hojeItem = page.locator('button[aria-label="Hoje"]');
    
    // Diagonal drag that is more vertical than horizontal
    await page.mouse.move(300, 400);
    await page.mouse.down();
    await page.mouse.move(280, 200, { steps: 20 });
    await page.mouse.up();

    // URL should NOT change
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain('/bible');
    await expect(hojeItem).toHaveAttribute('aria-current', 'page');
  });

  test('valid swipes should still work', async ({ page }) => {
    // Perform a clear swipe left
    await page.mouse.move(350, 400);
    await page.mouse.down();
    await page.mouse.move(50, 400, { steps: 10 });
    await page.mouse.up();

    await expect(page).toHaveURL(/\/bible/);
  });
});
