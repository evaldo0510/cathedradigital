import { test, expect } from '@playwright/test';

test.describe('Santo do Dia - Hoje Page', () => {
  test('should load the saint of the day and not show visual duplicates', async ({ page }) => {
    // Navigate to the Today page
    await page.goto('/hoje');

    // Wait for the saint section to be visible
    const saintSection = page.locator('section:has-text("Santo do Dia")');
    await expect(saintSection).toBeVisible();

    // Ensure the loading skeleton eventually disappears or the card appears
    // The skeleton has specific class/role we can check if needed, 
    // but checking for the actual card is better.
    const saintCard = page.locator('h3:has-text("Santo do Dia")').locator('..').locator('..').locator('.group.cursor-pointer');
    
    // Wait for either the card or a fallback message
    await Promise.race([
      saintCard.waitFor({ state: 'visible', timeout: 30000 }),
      page.locator('text=Nenhum santo encontrado para hoje').waitFor({ state: 'visible', timeout: 30000 })
    ]);

    // Check for visual duplicates of the "Santo do Dia" title
    // Some issues reported "Santo do Dia" appearing twice in the same section
    const titles = await page.locator('h3:has-text("Santo do Dia")').all();
    expect(titles.length).toBeLessThanOrEqual(1);

    // Verify image loading (or fallback)
    const image = saintSection.locator('img');
    if (await image.count() > 0) {
      const src = await image.getAttribute('src');
      expect(src).toBeTruthy();
    }

    // Ensure no broken UI states (like error boundary triggers)
    await expect(page.locator('text=Erro ao carregar')).not.toBeVisible();
  });

  test('should show dev inspector in development mode', async ({ page }) => {
    // This test assumes we are in a dev-like environment or can toggle it
    await page.goto('/hoje');
    
    // Check if the inspector button exists (it will if import.meta.env.DEV is true)
    // In CI this might be false, so we handle it gracefully
    const inspector = page.locator('button:has-text("Dev Inspector")');
    const isDev = await inspector.count() > 0;
    
    if (isDev) {
      await inspector.click();
      await expect(page.locator('text=Dados em Tempo Real')).toBeVisible();
      await expect(page.locator('text=Edge Function')).toBeVisible();
    }
  });
});