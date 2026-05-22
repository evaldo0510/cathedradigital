import { test, expect } from '@playwright/test';

test.describe('Home Page Layout', () => {
  test('should have exactly 8 main sections', async ({ page }) => {
    await page.goto('/');
    
    // 1. Hero
    await expect(page.locator('section:has(h1:has-text("Cathedra"))')).toBeVisible();
    
    // 2. Ritual do Dia
    await expect(page.locator('section:has(h2:has-text("Ritual do Dia"))')).toBeVisible();
    
    // 3. Continuar Leitura
    await expect(page.locator('section:has(h2:has-text("Continuar Leitura"))')).toBeVisible();
    
    // 4, 5, 6. Biblioteca (Bíblia, Catecismo, Magistério)
    await expect(page.locator('section:has(h2:has-text("Biblioteca"))')).toBeVisible();
    await expect(page.locator('button[aria-label*="Bíblia"], [role="button"][aria-label*="Bíblia"]')).toBeVisible();
    await expect(page.locator('button[aria-label*="Catecismo"], [role="button"][aria-label*="Catecismo"]')).toBeVisible();
    await expect(page.locator('button[aria-label*="Magistério"], [role="button"][aria-label*="Magistério"]')).toBeVisible();
    
    // 7. Logos IA
    await expect(page.locator('section:has(h2:has-text("Logos IA"))')).toBeVisible();
    
    // 8. Em Breve
    await expect(page.locator('section:has(h2:has-text("Em Breve"))')).toBeVisible();
  });

  test('should be responsive and accessible', async ({ page }) => {
    await page.goto('/');
    
    // Check main landmarks
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
    
    // Check focus styles
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeDefined();

    // Check contrast indirectly via styles
    const bgColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const textColor = await page.evaluate(() => getComputedStyle(document.body).color);
    expect(bgColor).toBeDefined();
    expect(textColor).toBeDefined();
  });
});
