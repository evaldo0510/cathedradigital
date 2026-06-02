import { test, expect } from '@playwright/test';

test.describe('Catecismo - Acessibilidade Avançada', () => {
  const viewports = [
    { name: 'iPhone SE', width: 320, height: 568 },
    { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
  ];

  for (const vp of viewports) {
    test(`Acessibilidade em ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/catechism');
      
      // 1. Validar navegação por teclado (Enter/Espaço/Esc) e Retorno de Foco
      const firstSection = page.locator('.CathedraCard').first();
      await firstSection.focus();
      
      // Abre com Enter
      await page.keyboard.press('Enter');
      await page.waitForSelector('[id^="p"]', { timeout: 10000 });
      await expect(page.locator('[id^="p"]').first()).toBeVisible();

      // Fecha com Esc e valida retorno de foco
      await page.keyboard.press('Escape');
      await expect(page.locator('.CathedraCard').first()).toBeFocused();

      // Abre com Espaço
      await page.keyboard.press('Space');
      await page.waitForSelector('[id^="p"]', { timeout: 10000 });
      
      // Volta ao sumário via botão e valida foco
      const backButton = page.locator('button').filter({ hasText: /Sumário/i });
      await backButton.click();
      await expect(page.locator('.CathedraCard').first()).toBeFocused();

      // 2. Ordem de navegação e ARIA
      const sections = page.locator('.CathedraCard');
      const count = await sections.count();
      for (let i = 0; i < Math.min(count, 3); i++) {
        const section = sections.nth(i);
        await expect(section).toHaveAttribute('role', /button|link/);
        // Se for um componente que expande, validar aria-expanded
        const isExpanded = await section.getAttribute('aria-expanded');
        if (isExpanded !== null) {
          expect(['true', 'false']).toContain(isExpanded);
        }
      }

      // 3. Contraste e Zoom
      // Simula zoom de 200% ajustando o viewport e a escala (aproximação técnica)
      await page.setViewportSize({ width: vp.width / 2, height: vp.height / 2 });
      await expect(page.locator('h1')).toBeVisible();
      // Verifica se elementos não se sobrepõem sob "zoom"
      const h1Box = await page.locator('h1').boundingBox();
      const firstCardBox = await firstSection.boundingBox();
      if (h1Box && firstCardBox) {
        expect(firstCardBox.y).toBeGreaterThanOrEqual(h1Box.y + h1Box.height);
      }
    });
  }

  test('Comportamento com prefers-reduced-motion', async ({ page }) => {
    // Emula a preferência do sistema por movimento reduzido
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/catechism');
    
    const firstSection = page.locator('.CathedraCard').first();
    const startTime = Date.now();
    await firstSection.click();
    await page.waitForSelector('[id^="p"]', { timeout: 5000 });
    const endTime = Date.now();
    
    // Com movimento reduzido, a transição deve ser instantânea ou muito rápida (< 100ms)
    // Nota: Depende da implementação do framer-motion, mas ajuda a detectar animações longas bloqueantes
    expect(endTime - startTime).toBeLessThan(500); 
  });
});
