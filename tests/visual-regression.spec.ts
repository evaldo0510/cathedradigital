import { test, expect } from '@playwright/test';

// Configuration for visual snapshots
const visualConfig = {
  maxDiffPixelRatio: 0.02,
  threshold: 0.1,
};

test.describe('Premium UI Regression Tests', () => {
  test('Home Page Visual Consistency', async ({ page }) => {
    await page.goto('/');
    // Wait for animations and content
    await page.waitForTimeout(1000);
    
    // Mask dynamic content to focus on components
    await expect(page).toHaveScreenshot('home-desktop.png', {
      ...visualConfig,
      mask: [
        page.locator('.dynamic-content'), // General class for dynamic parts
        page.locator('h1'), // Headlines can change by lang/A/B test
        page.locator('.text-secondary.italic'), // Dynamic saint names/quotes
      ]
    });
  });

  test('Hoje Page Visual Consistency', async ({ page }) => {
    // In actual Lovable CI, we handle auth session
    await page.goto('/hoje');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('hoje-desktop.png', {
      ...visualConfig,
      mask: [
        page.locator('h1'),
        page.locator('.text-secondary'),
        page.locator('.tabular-nums'), // Progress counters
        page.locator('.text-premium-tiny.font-bold.text-primary.uppercase'), // Streak/XP
      ]
    });
  });

  test('Spiritual Journal Visual Consistency', async ({ page }) => {
    await page.goto('/diario');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('journal-desktop.png', {
      ...visualConfig,
      mask: [
        page.locator('textarea'), // Content input
        page.locator('.font-serif.italic.text-xl'), // Quotes
        page.locator('.text-sm.font-serif.font-bold'), // Dates
      ]
    });
  });
});
