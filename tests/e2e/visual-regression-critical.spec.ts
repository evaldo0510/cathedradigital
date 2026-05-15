import { test, expect } from '@playwright/test';

const routes = {
  home: '/',
  hoje: '/hoje',
  diario: '/diario',
};

test.describe('Visual Regression - Critical Routes', () => {
  test('Home Page Visual Match', async ({ page }) => {
    await page.goto(routes.home);
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    // We ignore the dynamic parts like random quotes if necessary, 
    // but CathedraCard and CathedraButton should be stable.
    await expect(page).toHaveScreenshot('home-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('Hoje Page Visual Match', async ({ page }) => {
    // Note: Hoje requires auth usually, but we assume we are testing the UI components 
    // and if auth is required, the test might need a storageState or login step.
    // For this implementation, we focus on the structure.
    await page.goto(routes.hoje);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('hoje-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('Spiritual Journal Page Visual Match', async ({ page }) => {
    await page.goto(routes.diario);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('spiritual-journal-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });
});
