import { test, expect } from '@playwright/test';

test.describe('Portal Navigation & Redirects', () => {

  test('should redirect /dashboard to /hoje', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/hoje/);
  });

  test('Hoje portal should have main sections and navigation', async ({ page }) => {
    // Navigate to /hoje (the app should handle auth/mock auth if needed, 
    // but in these E2E tests we assume the environment is set up or we skip auth if possible)
    await page.goto('/hoje');

    // Check greeting (e.g., "Bom dia", "Boa tarde", "Boa noite")
    // The component uses profile?.name, but we might not have a profile in E2E unless logged in.
    // However, the test can check for the existence of the greeting structure.
    const greeting = page.locator('p.text-primary\\/60');
    await expect(greeting).toBeVisible();

    // Check "Portas da Fé" section
    const doorsSection = page.locator('text=Portas da Fé');
    await expect(doorsSection).toBeVisible();

    // Check "Acesso Rápido" section
    const quickAccess = page.locator('text=Acesso Rápido');
    await expect(quickAccess).toBeVisible();

    // Test navigation from a quick access card (e.g. Catecismo)
    const catechismCard = page.locator('div[role="button"]:has-text("Catecismo")');
    if (await catechismCard.isVisible()) {
        await catechismCard.click();
        await expect(page).toHaveURL(/\/catechism/);
    }
  });

  test('Biblioteca portal search and navigation', async ({ page }) => {
    await page.goto('/biblioteca');

    // Verify categories
    const categories = ['Palavra e Doutrina', 'Vida de Oração', 'Formação Intelectual', 'Caminho e Partilha'];
    for (const category of categories) {
      await expect(page.locator(`text=${category}`)).toBeVisible();
    }

    // Test search filtering
    const searchInput = page.getByPlaceholder('Buscar módulo...');
    await searchInput.fill('Rosário');
    
    // "Bíblia" should be hidden, "Rosário" should be visible
    await expect(page.locator('text=Bíblia')).not.toBeVisible();
    await expect(page.locator('text=Rosário')).toBeVisible();

    // Clear search
    await searchInput.fill('');
    await expect(page.locator('text=Bíblia')).toBeVisible();

    // Test navigation
    const rosaryCard = page.locator('div[role="button"]:has-text("Rosário")');
    await rosaryCard.click();
    await expect(page).toHaveURL(/\/rosary/);
  });

  test('Global search action from BottomNav', async ({ page }) => {
    await page.goto('/hoje');
    
    // Find search button in BottomNav
    const searchNav = page.locator('button[aria-label="Buscar"], a[href="/buscar"]');
    await searchNav.click();
    
    await expect(page).toHaveURL(/\/buscar/);
    
    const searchInput = page.getByPlaceholder(/Buscar santos, termos, discussões, temas, jornadas/i);
    await expect(searchInput).toBeVisible();
  });

});
