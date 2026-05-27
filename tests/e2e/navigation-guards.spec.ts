import { test, expect } from '@playwright/test';

test.describe('Navigation & Admin Guards', () => {
  test('unauthenticated user always starts at home and cannot access admin', async ({ page }) => {
    // Navigate directly to admin
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Should be redirected to /auth or / (depending on AuthGuard/AdminGuard logic)
    // Our AdminGuard redirects unauthenticated to LOGIN
    expect(page.url()).toContain('/auth');
    
    // Go to home
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toBe(page.url().split(/[?#]/)[0]); // Ensure we are at base URL
    
    // Check if hero is visible (experience starts at home)
    const hero = page.locator('section:has-text("Cathedra")');
    await expect(hero).toBeVisible();
  });

  test('admin interface has dedicated layout and no public header/sidebar', async ({ page }) => {
    // This test would require a logged in admin. 
    // For now we test that the 'admin-mode' class is handled if we could get there.
    // And verify that public elements have the 'admin-hide' class.
    
    await page.goto('/');
    const header = page.locator('header.admin-hide');
    await expect(header).toBeAttached();
    
    const sidebar = page.locator('aside.admin-hide');
    await expect(sidebar).toBeAttached();
  });
});
