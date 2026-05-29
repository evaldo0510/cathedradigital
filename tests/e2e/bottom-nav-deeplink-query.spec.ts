import { test, expect } from '@playwright/test';

test.describe('BottomNav Deep Links with Query Params', () => {
  test.beforeEach(async ({ page }) => {
    // Mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('item "Hoje" should be active when entering via /hoje?ref=share', async ({ page }) => {
    // Ensure we are in PT for the label
    await page.goto('/hoje?ref=share&lang=pt');
    await page.waitForLoadState('networkidle');
    
    const hojeItem = page.locator('button[aria-label="Hoje"]');
    await expect(hojeItem).toHaveAttribute('aria-current', 'page');
  });

  test('item "Hoje" should be active when entering via /?utm_source=test', async ({ page }) => {
    await page.goto('/?utm_source=test&lang=pt');
    await page.waitForLoadState('networkidle');
    
    const hojeItem = page.locator('button[aria-label="Hoje"]');
    await expect(hojeItem).toHaveAttribute('aria-current', 'page');
  });

  test('item "Bible" should be active when entering via /bible?version=arc', async ({ page }) => {
    await page.goto('/bible?version=arc&lang=pt');
    await page.waitForLoadState('networkidle');
    
    const bibleItem = page.locator('button[aria-label="Bíblia"]');
    await expect(bibleItem).toHaveAttribute('aria-current', 'page');
  });
});
