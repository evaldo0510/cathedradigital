import { test, expect } from '@playwright/test';

test.describe('Catecismo - Acessibilidade Avançada', () => {
  // O Playwright já gerencia o viewport via projetos no config
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/catechism');
    // Espera o conteúdo inicial carregar
    await page.waitForSelector('.CathedraCard', { timeout: 15000 });
  });

  test('Navegação por teclado e Retorno de Foco', async ({ page }) => {
    const firstPart = page.locator('[role="button"]').filter({ hasText: /PARTE/ }).first();
    await firstPart.focus();
    
    // 1. Abre com Enter
    await page.keyboard.press('Enter');
    await page.waitForSelector('text=Voltar às Partes', { timeout: 10000 });
    
    // 2. Navega nas seções e abre uma
    const firstSection = page.locator('[role="button"]').filter({ hasText: /Seção/i }).first();
    const sectionId = await firstSection.getAttribute('id');
    await firstSection.focus();
    await page.keyboard.press('Space');
    
    // 3. Verifica se abriu a leitura
    await page.waitForSelector('[id^="p"]', { timeout: 10000 });
    await expect(page.locator('[id^="p"]').first()).toBeVisible();

    // 4. Fecha com Esc e valida retorno de foco
    await page.keyboard.press('Escape');
    await page.waitForSelector('text=Voltar às Partes', { timeout: 10000 });
    if (sectionId) {
      await expect(page.locator(`#${sectionId}`)).toBeFocused();
    }

    // 5. Volta ao sumário via botão e valida foco (opcional, já validamos Esc)
    await firstSection.click();
    await page.waitForSelector('button:has-text("Sumário")', { timeout: 10000 });
    const backButton = page.locator('button').filter({ hasText: /Sumário/i });
    await backButton.click();
    if (sectionId) {
      await expect(page.locator(`#${sectionId}`)).toBeFocused();
    }
  });

  test('Ordem de navegação e ARIA', async ({ page }) => {
    const parts = page.locator('[role="button"]').filter({ hasText: /PARTE/ });
    const count = await parts.count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      const part = parts.nth(i);
      await expect(part).toHaveAttribute('role', 'button');
      await expect(part).toHaveAttribute('aria-label', /Ver PARTE/i);
      await expect(part).toHaveAttribute('tabindex', '0');
    }
  });

  test('Comportamento com prefers-reduced-motion', async ({ page }) => {
    // Emula a preferência do sistema por movimento reduzido
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    const firstPart = page.locator('[role="button"]').filter({ hasText: /PARTE/ }).first();
    const startTime = Date.now();
    await firstPart.click();
    await page.waitForSelector('text=Voltar às Partes', { timeout: 10000 });
    const endTime = Date.now();
    
    // Com movimento reduzido, a transição deve ser rápida
    expect(endTime - startTime).toBeLessThan(1000); 
  });

  test('Estabilidade de layout sob Zoom', async ({ page }) => {
    // Aumentamos o tamanho da fonte ou simulamos zoom via viewport menor mantendo densidade
    await page.setViewportSize({ width: 320, height: 480 });
    const header = page.locator('h1').filter({ hasText: /Catecismo/i });
    await expect(header).toBeVisible();
    
    const firstPart = page.locator('[role="button"]').filter({ hasText: /PARTE/ }).first();
    const hBox = await header.boundingBox();
    const pBox = await firstPart.boundingBox();
    
    if (hBox && pBox) {
      // Garante que não há overlap (o card deve estar abaixo do header)
      expect(pBox.y).toBeGreaterThanOrEqual(hBox.y + hBox.height);
    }
  });
});

