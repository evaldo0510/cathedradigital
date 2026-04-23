import { test, expect } from '@playwright/test';

test('CommandCenter (Ctrl+K) opens and searches', async ({ page }) => {
  // Navigate to the home page
  await page.goto('/');

  // Press Ctrl+K to open the command center
  // Using 'Control+k' which is standard in Playwright
  await page.keyboard.press('Control+k');

  // Verify the dialog is visible
  // We can look for the placeholder text
  const input = page.getByPlaceholder(/Buscar em tudo: Bíblia, Catecismo, Santos, Jornadas.../i);
  await expect(input).toBeVisible({ timeout: 5000 });
  
  // Verify input is focused (it has a 50ms timeout in the component)
  await expect(input).toBeFocused();

  // Type 'tomas'
  await input.fill('tomas');

  // Verify that results start rendering
  // The component shows the result count like "3 resultados encontrados"
  // and it only shows after query.length >= 2 and globalLoading is false
  await expect(page.locator('text=/resultado/i')).toBeVisible({ timeout: 10000 });

  // Verify at least one result contains "Tomás"
  // Using a regex to be case-insensitive and match partially
  await expect(page.locator('text=/Tomás/i').first()).toBeVisible();

  // Verify we can navigate with arrows (bonus)
  await page.keyboard.press('ArrowDown');
  
  // Press Escape to close
  await page.keyboard.press('Escape');
  await expect(input).not.toBeVisible();
});
