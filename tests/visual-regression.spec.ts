import { test, expect } from '@playwright/test';

// Configuration for visual snapshots
const visualConfig = {
  maxDiffPixelRatio: 0.02,
  threshold: 0.1,
};

test.describe('Premium UI Regression Tests', () => {
  test('Design System Guide consistency', async ({ page }) => {
    await page.goto('/design-system');
    await page.waitForTimeout(1000);
    
    // Validate that the design system documentation itself looks correct
    await expect(page).toHaveScreenshot('design-system-guide.png', visualConfig);
  });

  test('Home Page Visual Consistency', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('home-desktop.png', {
      ...visualConfig,
      mask: [
        page.locator('.dynamic-content'),
        page.locator('h1'),
        page.locator('.text-secondary.italic'),
      ]
    });
  });
});
