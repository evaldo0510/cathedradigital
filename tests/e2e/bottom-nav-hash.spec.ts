import { test, expect } from '@playwright/test';

test.describe('BottomNav Hash Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('item "Hoje" should be active when entering via /hoje#versiculo', async ({ page }) => {
    await page.goto('/hoje#versiculo?lang=pt');
    await page.waitForLoadState('networkidle');
    
    const hojeItem = page.locator('button[aria-label="Hoje"]');
    await expect(hojeItem).toHaveAttribute('aria-current', 'page');
  });

  test('item "Bíblia" should be active when entering via /bible/1#secao', async ({ page }) => {
    await page.goto('/bible/1#secao?lang=pt');
    await page.waitForLoadState('networkidle');
    
    const bibleItem = page.locator('button[aria-label="Bíblia"]');
    await expect(bibleItem).toHaveAttribute('aria-current', 'page');
  });

  test('navigation by swipe should preserve hash if intended or at least not break', async ({ page }) => {
    await page.goto('/hoje#versiculo?lang=pt');
    
    // Swipe to Bible
    await page.mouse.move(300, 400);
    await page.mouse.down();
    await page.mouse.move(50, 400, { steps: 10 });
    await page.mouse.up();

    await expect(page).toHaveURL(/\/bible/);
    const bibleItem = page.locator('button[aria-label="Bíblia"]');
    await expect(bibleItem).toHaveAttribute('aria-current', 'page');
  });
});
