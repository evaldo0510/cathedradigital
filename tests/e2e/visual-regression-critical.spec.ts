import { test, expect } from '@playwright/test';

const routes = {
  home: '/',
  hoje: '/hoje',
  diario: '/diario',
};

// Elements that are dynamic and should be masked during visual tests
const MASK_SELECTORS = [
  '.dynamic-date',
  '.dynamic-quote',
  '.user-name',
  '.streak-count',
  '.xp-count',
  '[data-testid="liturgy-text"]',
  '[data-testid="saint-of-the-day-name"]',
  '.saint-of-the-day-card h4',
  '.saint-of-the-day-card p',
  // Mask anything that might change daily
  '.liturgia-content',
  '.diario-entry-date'
];

test.describe('Visual Regression - Critical Routes with Masking', () => {
  test('Home Page Visual Match', async ({ page }) => {
    await page.goto(routes.home);
    await page.waitForLoadState('networkidle');
    
    // Additional wait for any framer-motion animations
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('home-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      mask: MASK_SELECTORS.map(s => page.locator(s)).filter(async l => (await l.count()) > 0),
    });
  });

  test('Hoje Page Visual Match', async ({ page }) => {
    // Assuming we might need to be logged in for /hoje
    // In a real CI, we'd use storageState, but here we check if we're redirected
    await page.goto(routes.hoje);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('hoje-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
      mask: MASK_SELECTORS.map(s => page.locator(s)).filter(async l => (await l.count()) > 0),
    });
  });

  test('Spiritual Journal Page Visual Match', async ({ page }) => {
    await page.goto(routes.diario);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('spiritual-journal-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
      mask: MASK_SELECTORS.map(s => page.locator(s)).filter(async l => (await l.count()) > 0),
    });
  });
});
