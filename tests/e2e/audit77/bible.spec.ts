import { test, expect } from '@playwright/test';

test.describe('AUDIT 7.7 — Bíblia', () => {
  test('Jornada completa na Bíblia', async ({ page }) => {
    await page.goto('http://localhost:8080/biblia');
    
    // 1. Home da Bíblia e Livros
    const book = page.locator('[data-testid="bible-book"]').first();
    await expect(book).toBeVisible();
    await book.click();
    
    // 2. Capítulos
    const chapter = page.locator('[data-testid="bible-chapter"]').first();
    await expect(chapter).toBeVisible();
    await chapter.click();
    
    // 3. Reader e Texto
    await expect(page.locator('[data-testid="bible-text"]')).toBeVisible();
    
    // 4. Navegação
    const nextBtn = page.locator('[data-testid="next-chapter"]');
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await expect(page.url()).toContain('ch=2');
    }
  });
});
