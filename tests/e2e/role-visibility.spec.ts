import { test, expect } from '@playwright/test';

test.describe('Role-based UI Visibility', () => {
  test('should not show admin links for guest users', async ({ page }) => {
    await page.goto('/');
    
    // Check sidebar links
    const sidebar = page.locator('nav');
    await expect(sidebar.locator('text=Administração')).not.toBeVisible();
    await expect(sidebar.locator('text=Auditoria Visual')).not.toBeVisible();
    await expect(sidebar.locator('text=Transações')).not.toBeVisible();
    
    // Attempt direct access to admin route
    await page.goto('/admin');
    
    // Should show login page or 403 (depending on if they are redirected to login first)
    // Since /admin is wrapped in AdminGuard, and AdminGuard redirects to login if no user
    const url = page.url();
    expect(url).toContain('/login');
  });
});
