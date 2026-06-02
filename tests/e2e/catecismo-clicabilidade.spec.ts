import { test, expect } from '@playwright/test';

test.describe('Catecismo Mobile - Clicabilidade e Integridade', () => {
  const viewports = [
    { name: 'iPhone SE (Small)', width: 320, height: 568 },
    { name: 'iPhone 12/13/14 (Standard)', width: 390, height: 844 },
    { name: 'iPhone 14 Pro Max (Large)', width: 430, height: 932 },
    { name: 'Pixel 7', width: 412, height: 915 },
    { name: 'Galaxy S23', width: 360, height: 780 },
    { name: 'iPad Portrait', width: 768, height: 1024 },
  ];

  for (const vp of viewports) {
    test(`Validar fluxo de navegação e expansão em ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      
      // Navega para o Catecismo
      await page.goto('/catechism');
      
      // 1. Validar visualização de Partes (Sumário Principal)
      await page.waitForSelector('text=Sacra Doctrina', { timeout: 15000 });
      const parts = page.locator('.cursor-pointer').filter({ hasText: /PARTE/ });
      const partsCount = await parts.count();
      expect(partsCount).toBeGreaterThan(0);

      // 2. Testar clique em uma Parte para abrir Seções
      const firstPart = parts.first();
      const partTitle = await firstPart.innerText();
      await firstPart.click();
      
      // Verificar se mudou para a visualização de seções
      await expect(page.locator('text=Voltar às Partes')).toBeVisible();
      const sections = page.locator('h3').filter({ hasText: /Seção/i || /./ }); // Captura títulos de seções
      expect(await sections.count()).toBeGreaterThan(0);

      // 3. Testar clique em uma Seção para abrir a Leitura (Resposta/Conteúdo)
      const firstSection = page.locator('.CathedraCard').first();
      await firstSection.click();

      // Verificar se o conteúdo da leitura apareceu (parágrafos §)
      await page.waitForSelector('[id^="p"]', { timeout: 10000 });
      const paragraphs = page.locator('[id^="p"]');
      expect(await paragraphs.count()).toBeGreaterThan(0);
      
      // Verificar se o primeiro parágrafo está visível
      await expect(paragraphs.first()).toBeVisible();

      // 4. Testar o "Fechar" (Voltar) mantendo a posição
      const backToSections = page.locator('button').filter({ hasText: /Sumário/i });
      await backToSections.click();
      
      // Deve voltar para a lista de seções
      await expect(page.locator('text=Voltar às Partes')).toBeVisible();

      // 5. Testar voltar para as partes
      await page.locator('text=Voltar às Partes').click();
      await expect(page.locator('text=Sacra Doctrina')).toBeVisible();

      // 6. Validar clicabilidade técnica (overlap check) em uma amostra
      const allClickables = page.locator('button, .cursor-pointer, input');
      const sampleCount = Math.min(await allClickables.count(), 5);
      
      for (let i = 0; i < sampleCount; i++) {
        const el = allClickables.nth(i);
        await expect(el).toBeVisible();
        
        // Verifica se é clicável tecnicamente (sem sobreposição)
        const box = await el.boundingBox();
        if (box && box.y < vp.height) {
          await el.click({ trial: true });
        }
      }
    });
  }
});
