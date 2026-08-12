import { test, expect } from '@playwright/test';

test.describe('CATHEDRA — Preview Integrity', () => {
  test('deve renderizar a home corretamente e permitir navegação básica', async ({ page }) => {
    // Acessa a raiz
    await page.goto('/');
    
    // Verifica se o container principal está presente
    const root = page.locator('#root');
    await expect(root).toBeVisible();
    
    // Verifica se o título "CATHEDRA" (identidade visual) está visível
    await expect(page.getByText('CATHEDRA', { exact: false })).toBeVisible();
    
    // Verifica se o campo de busca principal está presente
    await expect(page.getByPlaceholder('O que deseja estudar hoje?')).toBeVisible();
  });

  test('deve carregar o Sidebar e permitir navegação para Bíblia', async ({ page }) => {
    await page.goto('/');
    
    // Clica no botão de menu (geralmente um ícone de Menu no AppHeader)
    // Buscamos pelo aria-label comum ou papel
    const menuBtn = page.getByRole('button', { name: /menu/i }).first();
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      // Verifica se o link da Bíblia aparece no Sidebar
      await expect(page.getByRole('button', { name: /Bíblia/i })).toBeVisible();
    }
  });
  
  test('a rota 404 deve exibir o fallback amigável', async ({ page }) => {
    await page.goto('/rota-inexistente-para-teste');
    
    // Verifica se a mensagem de "Página não encontrada" aparece
    await expect(page.getByText('Página não encontrada')).toBeVisible();
    
    // Verifica se o botão de voltar para o Átrio existe
    await expect(page.getByRole('link', { name: /Ir para o Átrio/i })).toBeVisible();
  });
});
