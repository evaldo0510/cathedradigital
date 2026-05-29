import { test, expect } from '@playwright/test';

test.describe('BottomNav Swipe Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport as swipe logic depends on window.innerWidth < 1024
    await page.setViewportSize({ width: 390, height: 844 });
    // Force PT language to ensure labels match
    await page.goto('/?lang=pt');
    await page.waitForLoadState('networkidle');
  });

  test('swiping left on Hoje should navigate to Bible', async ({ page }) => {
    // Wait for the BottomNav to be visible
    const nav = page.locator('nav[aria-label*="Navegação"], nav[aria-label*="Navigation"]');
    await expect(nav).toBeVisible();

    // Check initial state (Hoje should be active)
    const hojeItem = page.locator('button[aria-label="Hoje"]');
    await expect(hojeItem).toHaveAttribute('aria-current', 'page');

    // Perform swipe left (drag from right to left)
    // We use a safe area in the middle of the screen
    await page.mouse.move(300, 400);
    await page.mouse.down();
    await page.mouse.move(50, 400, { steps: 20 });
    await page.mouse.up();

    // Wait for navigation to /bible
    await expect(page).toHaveURL(/\/bible/);
    
    // Verify Bible is active in BottomNav
    const bibleItem = page.locator('button[aria-label="Bíblia"]');
    await expect(bibleItem).toHaveAttribute('aria-current', 'page');
  });

  test('swiping left on Bible should navigate to Catechism', async ({ page }) => {
    await page.goto('/bible?lang=pt');
    await page.waitForLoadState('networkidle');
    
    // Check Bible is active
    const bibleItem = page.locator('button[aria-label="Bíblia"]');
    await expect(bibleItem).toHaveAttribute('aria-current', 'page');

    // Perform swipe left
    await page.mouse.move(300, 400);
    await page.mouse.down();
    await page.mouse.move(50, 400, { steps: 20 });
    await page.mouse.up();

    // Wait for navigation to /catechism
    await expect(page).toHaveURL(/\/catechism/);
    
    // Verify Catechism is active
    const catechismItem = page.locator('button[aria-label="Catecismo"]');
    await expect(catechismItem).toHaveAttribute('aria-current', 'page');
  });

  test('swiping right on Catechism should navigate back to Bible', async ({ page }) => {
    await page.goto('/catechism?lang=pt');
    await page.waitForLoadState('networkidle');
    
    // Check Catechism is active
    const catechismItem = page.locator('button[aria-label="Catecismo"]');
    await expect(catechismItem).toHaveAttribute('aria-current', 'page');

    // Perform swipe right (drag from left to right)
    await page.mouse.move(50, 400);
    await page.mouse.down();
    await page.mouse.move(300, 400, { steps: 20 });
    await page.mouse.up();

    // Wait for navigation back to /bible
    await expect(page).toHaveURL(/\/bible/);
    
    // Verify Bible is active
    const bibleItem = page.locator('button[aria-label="Bíblia"]');
    await expect(bibleItem).toHaveAttribute('aria-current', 'page');
  });
});
