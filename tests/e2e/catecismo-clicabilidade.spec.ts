import { test, expect } from '@playwright/test';

test.describe('Catecismo Mobile - Clicabilidade e Integridade', () => {
  const viewports = [
    { name: 'iPhone 6/7/8', width: 375, height: 667 },
    { name: 'iPhone 8 Plus', width: 414, height: 736 },
    { name: 'Android Small', width: 360, height: 640 },
    { name: 'iPad Portrait', width: 768, height: 1024 },
  ];

  for (const vp of viewports) {
    test(`Validar elementos clicáveis em ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      
      // Navega para o Catecismo
      await page.goto('/catechism');
      
      // Espera o carregamento do conteúdo principal
      await page.waitForSelector('.catechism-section, [data-testid="catechism-content"]', { timeout: 15000 });

      // Seleciona elementos que devem ser clicáveis (parágrafos, botões de busca, etc.)
      // No Catecismo, os parágrafos costumam ser interativos para abrir a Logos IA ou notas
      const clickableSelectors = [
        'button',
        'a[role="button"]',
        '.catechism-section',
        '.clickable-paragraph',
        '[role="link"]'
      ];
      
      const elements = page.locator(clickableSelectors.join(', '));
      const count = await elements.count();
      
      console.log(`Encontrados ${count} elementos clicáveis em ${vp.name}`);

      // Testamos uma amostra dos primeiros 10 elementos para garantir performance do teste
      for (let i = 0; i < Math.min(count, 10); i++) {
        const el = elements.nth(i);
        
        // 1. Verificar visibilidade
        await expect(el).toBeVisible();

        // 2. Verificar se não está "coberto" por outro elemento (overlap)
        const isObscured = await el.evaluate((node) => {
          const rect = node.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return false;
          
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          const elementAtPoint = document.elementFromPoint(x, y);
          
          return elementAtPoint && !node.contains(elementAtPoint) && !elementAtPoint.contains(node);
        });

        if (isObscured) {
          const details = await el.evaluate((node) => {
            const rect = node.getBoundingClientRect();
            const topEl = document.elementFromPoint(rect.left + rect.width/2, rect.top + rect.height/2);
            return `Elemento ${node.tagName}.${node.className} obscurecido por ${topEl?.tagName}.${topEl?.className}`;
          });
          console.warn(`Aviso de sobreposição em ${vp.name}: ${details}`);
        }

        // 3. Verificar área de toque mínima (44x44px recomendado pela Apple/Google para mobile)
        if (vp.width < 768) {
          const box = await el.boundingBox();
          if (box && (box.width < 40 || box.height < 40)) {
            // Permitimos uma margem pequena (40px em vez de 44px) para elementos muito densos, mas alertamos
            console.warn(`Elemento pequeno detectado em ${vp.name}: ${Math.round(box.width)}x${Math.round(box.height)}px`);
          }
        }
        
        // 4. Testar clique (opcional, verifica se não lança erro)
        // Somente se for visível e no viewport
        const box = await el.boundingBox();
        if (box && box.y < vp.height) {
           await el.click({ trial: true }); // Apenas verifica se é clicável sem realizar a ação de fato
        }
      }
    });
  }
});
