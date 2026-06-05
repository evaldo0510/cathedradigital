import { test, expect } from '@playwright/test';

test.describe('Catechism Cache Integrity', () => {
  test.beforeEach(async ({ page }) => {
    // Simulate admin session
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        currentSession: {
          user: { id: 'admin-id', email: 'admin@example.com' },
          access_token: 'fake-token'
        }
      }));
    });

    // Navigate to the integrity screen
    await page.goto('/catechism/integrity');
  });

  test('should invalidate cache successfully', async ({ page }) => {
    // Handle the confirm dialog
    page.on('dialog', dialog => dialog.accept());
    
    const clearButton = page.locator('button[title="Limpar todo o cache"]');
    await expect(clearButton).toBeVisible();
    await clearButton.click();
    
    await expect(page.getByText('Conteúdo Padronizado: Cache do catecismo invalidado com sucesso')).toBeVisible();
  });

  test('should show error message on failure', async ({ page }) => {
    // Intercept the delete request to simulate failure
    await page.route('**/rest/v1/catechism_cache*', route => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error', message: 'Database failure' }),
        });
      } else {
        route.continue();
      }
    });

    page.on('dialog', dialog => dialog.accept());
    
    const clearButton = page.locator('button[title="Limpar todo o cache"]');
    await clearButton.click();
    
    await expect(page.getByText('Falha na Verificação de Integridade: Erro ao invalidar cache do catecismo')).toBeVisible();
  });

  test('should allow invalidating twice in a row', async ({ page }) => {
    page.on('dialog', dialog => dialog.accept());
    
    const clearButton = page.locator('button[title="Limpar todo o cache"]');
    
    // First time
    await clearButton.click();
    await expect(page.getByText('Conteúdo Padronizado: Cache do catecismo invalidado com sucesso')).toBeVisible();
    
    // Wait a bit for the UI to update
    await page.waitForTimeout(1000);
    
    // Second time
    await clearButton.click();
    await expect(page.getByText('Conteúdo Padronizado: Cache do catecismo invalidado com sucesso')).toBeVisible();
  });
});
