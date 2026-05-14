import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('Landing Page (Desktop) - Visual Snapshot', async ({ page }) => {
    await page.goto('/');
    // Wait for critical animations and images
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); 
    
    // Check main sections exist
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('section').first()).toBeVisible();
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('landing-page-desktop.png', {
      fullPage: true,
      mask: [page.locator('#video')], // Mask video to avoid diffs
    });
  });

  test('Mobile Home View - Visual Snapshot', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('landing-page-mobile.png', {
      fullPage: true,
    });
  });

  test('Auth Page - Visual Snapshot', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('form')).toBeVisible();
    await expect(page).toHaveScreenshot('auth-page.png');
  });
});
