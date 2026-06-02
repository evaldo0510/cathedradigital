import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Catecismo - Acessibilidade Avançada', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/catechism');
    await page.waitForSelector('[role="button"]', { timeout: 15000 });
  });

  test('Auditoria de Acessibilidade Automática (axe-core)', async ({ page }, testInfo) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    await testInfo.attach('accessibility-scan-results', {
      body: JSON.stringify(results, null, 2),
      contentType: 'application/json'
    });

    const strictViolations = results.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(strictViolations, `Encontradas violações graves de acessibilidade no Catecismo: ${JSON.stringify(strictViolations)}`).toEqual([]);
  });

  test('Navegação por teclado e Retorno de Foco', async ({ page }) => {
    // 1. Navega até uma Parte e abre com Enter
    const firstPart = page.locator('[role="button"]').filter({ hasText: /PARTE/ }).first();
    const partId = await firstPart.getAttribute('id') || 'part-card-0';
    
    await firstPart.focus();
    await page.keyboard.press('Enter');
    await page.waitForSelector('text=Voltar às Partes', { timeout: 10000 });
    
    // 2. Navega nas seções e abre uma com Espaço
    const firstSection = page.locator('[role="button"]').filter({ hasText: /Seção/i }).first();
    const sectionId = await firstSection.getAttribute('id');
    
    await firstSection.focus();
    await page.keyboard.press(' ');
    
    // 3. Verifica se abriu a leitura
    await page.waitForSelector('[id^="p"]', { timeout: 10000 });
    await expect(page.locator('[id^="p"]').first()).toBeVisible();

    // 4. Fecha com Esc e valida retorno de foco ao elemento que disparou (Seção)
    await page.keyboard.press('Escape');
    await page.waitForSelector('text=Voltar às Partes', { timeout: 10000 });
    if (sectionId) {
      await expect(page.locator(`#${sectionId}`)).toBeFocused();
    }

    // 5. Volta ao sumário de partes e valida foco na Parte disparadora
    const backToParts = page.locator('button').filter({ hasText: /Voltar às Partes/i });
    await backToParts.click();
    await page.waitForSelector('[role="button"]:has-text("PARTE")', { timeout: 10000 });
    
    await expect(page.locator(`#${partId}`)).toBeFocused();
  });

  test('Comportamento com prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    const firstPart = page.locator('[role="button"]').filter({ hasText: /PARTE/ }).first();
    const startTime = Date.now();
    await firstPart.click();
    await page.waitForSelector('text=Voltar às Partes', { timeout: 10000 });
    const endTime = Date.now();
    
    // Transição instantânea ou muito rápida (< 500ms)
    expect(endTime - startTime).toBeLessThan(500); 
  });

  test('Contraste de cores e Zoom (200%)', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 480 });
    
    const results = await new AxeBuilder({ page })
      .withTags(['color-contrast'])
      .analyze();
      
    expect(results.violations).toEqual([]);
    
    const header = page.locator('h1').filter({ hasText: /Catecismo/i });
    await expect(header).toBeVisible();
    
    const box = await header.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(640);
  });
});
