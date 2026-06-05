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
});
