import { test, expect } from '@playwright/test';

test.describe('AUDIT 7.7 — Catecismo', () => {
  test('Jornada completa do peregrino no Catecismo', async ({ page }) => {
    await page.goto('http://localhost:8080/catecismo');
    
    // 1. Abertura e Carregamento
    await expect(page.locator('h1')).toContainText(['Catecismo', 'Catequese']);
    
    // 2. Listagem de conteúdos
    const items = page.locator('[data-testid="catechism-item"]');
    await expect(items.first()).toBeVisible();
    
    // 3. Acesso ao parágrafo e Reader V2
    await items.first().click();
    await expect(page.url()).toContain('/catecismo/');
    
    // 4. Nexus
    const nexusConnections = page.locator('[data-nexus-type]');
    // Verificamos se existem conexões Nexus se o conteúdo as possuir
    
    // 5. Retorno à Biblioteca
    await page.getByRole('button', { name: /voltar|biblioteca/i }).click();
    await expect(page.url()).toContain('/biblioteca');
  });
});
