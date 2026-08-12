import { test, expect } from '@playwright/test';

test.describe('AUDIT 7.7 — Santos', () => {
  test('Jornada completa dos Santos', async ({ page }) => {
    await page.goto('http://localhost:8080/santos');
    
    // 1. Lista de Santos
    const saintCard = page.locator('[data-testid="saint-card"]').first();
    await expect(saintCard).toBeVisible();
    
    // 2. Detalhe completo
    await saintCard.click();
    await expect(page.locator('h1')).toBeVisible();
    
    // 3. História completa (não apenas resumo)
    const content = page.locator('[data-testid="saint-biography"]');
    await expect(content).not.toBeEmpty();
  });
});
