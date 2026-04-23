import { test, expect } from '@playwright/test';

test.describe('Search and Navigation', () => {
  
  test('search with no matches shows empty state', async ({ page }) => {
    // Navigate to the search page
    await page.goto('/buscar');

    // Find the search input and type a random term that unlikely has results
    const searchInput = page.getByPlaceholder(/Buscar santos, termos, discussões, temas, jornadas/i);
    await searchInput.fill('xyz123abcnonexistentterm');

    // Wait for the search to process (it might have a debounce and network request)
    // The "Nenhum resultado encontrado." message should appear
    const noResultsMessage = page.locator('text=Nenhum resultado encontrado.');
    await expect(noResultsMessage).toBeVisible({ timeout: 10000 });
    
    // Verify the subtext is also present
    await expect(page.locator('text=Tente buscar por termos mais genéricos')).toBeVisible();
  });

  test('clicking a search result card navigates to detail view', async ({ page }) => {
    // Navigate to the search page
    await page.goto('/buscar');

    // Find the search input and type 'tomas'
    const searchInput = page.getByPlaceholder(/Buscar santos, termos, discussões, temas, jornadas/i);
    await searchInput.fill('tomas');

    // Locate result cards - they have a specific class from SearchResultCard.tsx
    // The cards are clickable and navigate to the detail page
    const firstCard = page.locator('.cursor-pointer.hover\\:bg-muted\\/30').first();
    
    // Wait for at least one card to be visible
    await expect(firstCard).toBeVisible({ timeout: 10000 });

    // Click the first card
    await firstCard.click();

    // Verify the URL changed to include /santos/
    await expect(page).toHaveURL(/\/santos\//);

    // Verify the detail screen is displayed
    // We can look for "Sua História" which is a header in SaintDetail.tsx
    const detailHeader = page.locator('text=Sua História');
    await expect(detailHeader).toBeVisible({ timeout: 10000 });

    // Verify the saint's name is in the detail view
    // Since we searched for 'tomas', the name should likely contain 'Tomás'
    const saintName = page.locator('h2.font-serif.font-bold').first();
    await expect(saintName).toContainText(/Tomás/i);
  });

});
