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

  test('Comportamento com prefers-reduced-motion (Sistema e Toggle)', async ({ page }) => {
    // 1. Testa via emulação de mídia do sistema
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    // Verifica se a classe CSS foi aplicada (caso o sistema detecte automaticamente, 
    // embora no nosso caso dependa do hook de acessibilidade se implementado)
    // Se não aplicamos automaticamente via media query no JS, testamos o toggle manual abaixo.
    
    // 2. Testa Toggle Manual no Painel de Acessibilidade
    await page.keyboard.press('Alt+Shift+A'); // Atalho hipotético ou abre via clique
    // Vamos abrir via clique no header se o atalho não estiver garantido
    const a11yButton = page.locator('button[aria-label*="Acessibilidade"], button:has(.lucide-shield-check)');
    if (await a11yButton.isVisible()) {
      await a11yButton.click();
    } else {
      // Tenta abrir via menu se estiver em mobile
      const menuButton = page.locator('button[aria-label*="Menu"]');
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.locator('text=Acessibilidade').click();
      }
    }

    const reduceToggle = page.locator('#reduce-animations-toggle');
    await expect(reduceToggle).toBeVisible();
    await reduceToggle.click();
    
    // Verifica se a classe .reduce-animations foi aplicada ao html
    await expect(page.locator('html')).toHaveClass(/reduce-animations/);
    
    // 3. Valida se a transição entre seções é imediata
    const firstPart = page.locator('[role="button"]').filter({ hasText: /PARTE/ }).first();
    const startTime = Date.now();
    await firstPart.click();
    
    // Espera o conteúdo carregar
    await page.waitForSelector('text=Voltar às Partes', { timeout: 10000 });
    const endTime = Date.now();
    
    // Transição deve ser virtualmente instantânea (permitindo overhead de renderização < 300ms)
    const duration = endTime - startTime;
    console.log(`Duração da transição com redução de movimento: ${duration}ms`);
    expect(duration).toBeLessThan(400); 

    // 4. Verifica se o foco visível está reforçado
    const backButton = page.locator('button').filter({ hasText: /Voltar às Partes/i });
    await backButton.focus();
    const outline = await backButton.evaluate(el => window.getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe('none');
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
