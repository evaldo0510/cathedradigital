import { test, expect } from '@playwright/test';

test.describe('Bible Language Integrity E2E', () => {
  test('ensure no English book names appear in library', async ({ page }) => {
    await page.goto('/bible');
    
    // Open library
    const libraryBtn = page.getByRole('button', { name: /Biblioteca Sagrada/i });
    await libraryBtn.click();
    
    // Check forbidden terms
    const forbidden = ['Tobit', 'Judith', 'Wisdom', 'Sirach', 'Psalms', 'Genesis'];
    for (const term of forbidden) {
      const count = await page.getByText(new RegExp(`\\b${term}\\b`, 'i')).count();
      expect(count).toBe(0);
    }
  });

  test('ensure no English headers in reading view', async ({ page }) => {
    // Navigate direct to a composite book
    await page.goto('/bible?book=1%20Jo&ch=1');
    
    // Check for "Chapter" instead of "Capítulo"
    const chapterLabel = await page.getByText(/Chapter/i).count();
    expect(chapterLabel).toBe(0);
    
    const capituloLabel = await page.getByText(/Capítulo 1/i).count();
    expect(capituloLabel).toBeGreaterThan(0);
  });

  test('ensure search results are in Portuguese', async ({ page }) => {
    await page.goto('/bible');
    const searchTrigger = page.getByPlaceholder(/Pesquisar nas Escrituras/i);
    await searchTrigger.click();
    await searchTrigger.fill('Jesus');
    await page.keyboard.press('Enter');
    
    // Check results for any English placeholders
    const errorMsg = await page.getByText(/Error/i).count();
    expect(errorMsg).toBe(0);
  });
});
