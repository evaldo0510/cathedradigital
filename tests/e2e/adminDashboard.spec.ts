import { test, expect } from '@playwright/test';

test.describe('AdminDashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/dashboard');
  });

  test('renderiza gráficos', async ({ page }) => {
    await expect(page.locator('[data-test="grafico-1"]')).toBeVisible();
    await expect(page.locator('[data-test="grafico-2"]')).toBeVisible();
  });

  test('renderiza listagens', async ({ page }) => {
    await expect(page.locator('[data-test="listagem-1"]')).toBeVisible();
    
    // Navega para a aba de transações para ver a listagem-2
    await page.click('button:has-text("Financeiro")');
    await expect(page.locator('[data-test="listagem-2"]')).toBeVisible();
  });

  test('renderiza estados vazios', async ({ page }) => {
    // Clica em um segmento que provavelmente está vazio em ambiente de teste
    await page.click('button:has-text("Inativo")');
    await expect(page.locator('[data-test="estado-vazio-1"]')).toBeVisible();
  });

  test('filtragem de listagens', async ({ page }) => {
    await page.locator('[data-test="filtro-1"]').click();
    await page.click('role=option >> text=XP');
    await expect(page.locator('[data-test="listagem-1"]')).toBeVisible();
  });
});
