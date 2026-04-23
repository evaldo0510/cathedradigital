import { test, expect } from '@playwright/test';

test('CommandCenter (Ctrl+K) opens and searches', async ({ page }) => {
  // Navigate to the home page
  await page.goto('/');

  // Press Ctrl+K to open the command center
  await page.keyboard.press('Control+k');

  // Verify the dialog is visible and input is focused
  const input = page.getByPlaceholder(/Buscar em tudo: Bíblia, Catecismo, Santos, Jornadas.../i);
  await expect(input).toBeVisible();
  
  // Wait a moment for the focus transition if any
  await expect(input).toBeFocused();

  // Type 'tomas'
  await input.fill('tomas');

  // Verify that results start rendering
  // The component shows "X resultados encontrados" when there are matches
  const resultCount = page.locator('text=/resultado/i');
  await expect(resultCount).toBeVisible({ timeout: 10000 });

  // Verify at least one result card is visible
  // Based on the code, results are rendered in the list
  const firstResult = page.locator('div[role="button"]').first();
  await expect(firstResult).toBeVisible();
  
  // Check if it contains something related to the search
  await expect(page.locator('text=/Tomás/i').first()).toBeVisible();
});
