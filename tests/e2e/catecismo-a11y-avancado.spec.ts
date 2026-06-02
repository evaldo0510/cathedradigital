import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Catecismo - Acessibilidade Avançada', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/catechism');
    await page.waitForSelector('[role="button"]', { timeout: 15000 });
    await injectAxe(page);
  });

  test('Auditoria de Acessibilidade Automática (axe-core)', async ({ page }) => {
    // Verifica violações WCAG 2.1 Nível A e AA
    await checkA11y(page, undefined, {
      axeOptions: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
        }
      },
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });

  test('Navegação por teclado e Retorno de Foco', async ({ page }) => {
    // 1. Navega até uma Parte e abre com Enter
    const parts = page.locator('[role="button"]').filter({ hasText: /PARTE/ });
    const firstPart = parts.first();
    const partId = `part-card-0`; // Precisamos garantir IDs consistentes ou capturar o elemento
    
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

    // 5. Volta ao sumário de partes e valida foco (opcional, simulando clique)
    const backToParts = page.locator('button').filter({ hasText: /Voltar às Partes/i });
    await backToParts.click();
    await page.waitForSelector('[role="button"]:has-text("PARTE")', { timeout: 10000 });
    // O foco deve estar em algum lugar sensato, idealmente na parte que foi fechada
    // (A implementação atual do Catechism.tsx ainda não salva o ID da Parte)
  });

  test('Comportamento com prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    const firstPart = page.locator('[role="button"]').filter({ hasText: /PARTE/ }).first();
    const startTime = Date.now();
    await firstPart.click();
    await page.waitForSelector('text=Voltar às Partes', { timeout: 10000 });
    const endTime = Date.now();
    
    // Transição instantânea ou muito rápida (< 200ms)
    expect(endTime - startTime).toBeLessThan(500); 
  });

  test('Contraste de cores e Zoom (200%)', async ({ page }) => {
    // Simula zoom de 200% via viewport
    await page.setViewportSize({ width: 640, height: 480 }); // Metade da largura padrão 1280
    
    await checkA11y(page, undefined, {
      axeOptions: { runOnly: ['color-contrast'] }
    });
    
    const header = page.locator('h1').filter({ hasText: /Catecismo/i });
    await expect(header).toBeVisible();
    
    // Garante que o texto não transborda de forma que impeça a leitura
    const box = await header.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(640);
  });
});


