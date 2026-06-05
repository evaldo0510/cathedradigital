import { test, expect } from '@playwright/test';

test.describe('Catechism Cache Regression', () => {
  test('Manual invalidation of catechism_cache updates integrity screen', async ({ page }) => {
    // Navigate to the integrity page
    await page.goto('/catechism/integrity');
    
    // Verify we are on the right page
    await expect(page.locator('h1')).toContainText('Integridade do Conteúdo');
    
    // Check initial state (assuming some data is loaded or it's loading)
    const initialItemsCount = await page.locator('tbody tr').count();
    
    // Trigger manual cache invalidation (Clear all)
    const clearButton = page.getByTitle('Limpar todo o cache');
    
    // Handle the browser confirmation dialog
    page.once('dialog', dialog => {
      expect(dialog.message()).toContain('Deseja realmente limpar TODO o cache');
      dialog.accept();
    });
    
    await clearButton.click();
    
    // Verify success toast
    await expect(page.locator('text=Cache do catecismo limpo com sucesso')).toBeVisible();
    
    // After clearing, we expect the statistics to update
    // The "Nunca Acessados" count should reflect the cleared items
    const notCachedValue = page.locator('.text-premium-2xl').first();
    await expect(notCachedValue).not.toBeEmpty();
    
    // Verify that the table now shows missing items or updated status
    // Since everything was cleared, items should now appear as 'not_cached'
    await expect(page.locator('text=not_cached').first()).toBeVisible();
  });

  test('Successive invalidations update integrity screen at each step', async ({ page }) => {
    await page.goto('/catechism/integrity');
    
    // First clear
    page.once('dialog', dialog => dialog.accept());
    await page.getByTitle('Limpar todo o cache').click();
    await expect(page.locator('text=Cache do catecismo limpo com sucesso')).toBeVisible();
    
    // Reprocess one item
    await page.locator('button[title="Reprocessar agora"]').first().click();
    await expect(page.locator('text=reprocessado com sucesso')).toBeVisible();
    
    // Second clear
    page.once('dialog', dialog => dialog.accept());
    await page.getByTitle('Limpar todo o cache').click();
    await expect(page.locator('text=Cache do catecismo limpo com sucesso')).toBeVisible();
    
    // Verify it's back to cleared state
    await expect(page.locator('text=not_cached').first()).toBeVisible();
  });

  test('Error during invalidation displays institutional i18n message', async ({ page }) => {
    // We can simulate an error by intercepting the supabase request
    // This depends on how the clearCache is implemented (it uses .from().delete())
    await page.route('**/rest/v1/catechism_cache*', route => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Internal Server Error' })
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/catechism/integrity');
    
    page.once('dialog', dialog => dialog.accept());
    await page.getByTitle('Limpar todo o cache').click();
    
    // The component uses toast.error('Erro ao limpar cache')
    // Let's verify this message is shown in Portuguese
    await expect(page.locator('text=Erro ao limpar cache')).toBeVisible();
  });
});
