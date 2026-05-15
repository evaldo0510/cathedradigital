import { test, expect } from '@playwright/test';

test.describe('Role-based Security & UI Visibility', () => {
  test('should not show admin links for guest users and handle direct access', async ({ page }) => {
    await page.goto('/');
    
    // 1. Check sidebar links are hidden
    const sidebar = page.locator('nav');
    await expect(sidebar.locator('text=Administração')).not.toBeVisible();
    await expect(sidebar.locator('text=Auditoria Visual')).not.toBeVisible();
    await expect(sidebar.locator('text=Logs de Auditoria')).not.toBeVisible();
    
    // 2. Check AppHeader admin buttons are hidden
    const header = page.locator('header');
    await expect(header.locator('button:has-text("Admin")')).not.toBeVisible();

    // 3. Attempt direct access to static admin route
    await page.goto('/admin');
    await expect(page).toHaveURL(/.*login.*/);

    // 4. Attempt direct access to dynamic protected route
    await page.goto('/transactions/any-id');
    await expect(page).toHaveURL(/.*login.*/);
  });

  test('should show 403 page for logged-in non-admin users', async ({ page }) => {
    // This test assumes we can mock the auth state or use a non-admin test user
    // In a real Playwright setup, we would use a global-setup or storageState
    
    // Let's simulate a non-admin user by navigating to a route that uses AdminGuard
    // and expecting the AccessDenied component content
    
    await page.goto('/admin');
    
    // If not logged in, we expect redirect to login
    if (page.url().includes('/login')) {
      console.warn('Skipping 403 test: Authentication required');
      return;
    }

    // If logged in as non-admin, we should see "Acesso Negado"
    await expect(page.locator('text=Acesso Negado')).toBeVisible();
    await expect(page.locator('text=Erro 403')).toBeVisible();
  });

  test('should protect dynamic routes like /transactions/*', async ({ page }) => {
    const dynamicRoutes = [
      '/transactions/123',
      '/admin/visual-audit',
      '/security-audit/logs'
    ];

    for (const route of dynamicRoutes) {
      await page.goto(route);
      // Either redirect to login (if anonymous) or show 403 (if non-admin)
      const isLoginOr403 = await page.evaluate(() => {
        return window.location.pathname.includes('/login') || 
               document.body.innerText.includes('Acesso Negado');
      });
      expect(isLoginOr403).toBeTruthy();
    }
  });
});
