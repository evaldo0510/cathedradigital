import { test, expect } from '@playwright/test';

test.describe('Preferência de redução de movimento', () => {
  test.beforeEach(async ({ page }) => {
    // Acessar a página antes de cada teste
    await page.goto('/');
  });

  const abrirPainelAcessibilidade = async (page) => {
    // Abre o menu lateral no mobile
    const menuTrigger = page.locator('[data-testid="menu-trigger"]');
    if (await menuTrigger.isVisible()) {
      await menuTrigger.click();
    }
    
    // Clica no botão de Acessibilidade (A11y)
    const a11yTrigger = page.locator('[data-testid="a11y-trigger"]');
    await a11yTrigger.click();
  };

  test('persiste após recarregar a página', async ({ page }) => {
    await abrirPainelAcessibilidade(page);

    // Ativar a preferência de redução de movimento
    const toggle = page.locator('[data-testid="reducao-movimento-toggle"]');
    await toggle.click();
    
    // Verifica se a classe foi aplicada ao HTML
    await expect(page.locator('html')).toHaveClass(/reduce-animations/);

    // Recarregar a página
    await page.reload();

    // Abrir novamente o painel para verificar
    await abrirPainelAcessibilidade(page);

    // Verificar se a preferência está ativada após recarregar
    // No Radix UI Switch, usamos aria-checked
    await expect(page.locator('[data-testid="reducao-movimento-toggle"]')).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('html')).toHaveClass(/reduce-animations/);
  });

  test('mantém o comportamento ao abrir e fechar seções', async ({ page }) => {
    await abrirPainelAcessibilidade(page);
    await page.locator('[data-testid="reducao-movimento-toggle"]').click();
    
    // Fecha o painel clicando fora (no overlay)
    await page.mouse.click(0, 0);
    await page.waitForTimeout(500);
    await page.mouse.click(0, 0); // Fecha o sidebar

    // Navegar para o Catecismo
    await page.locator('[data-testid="nav-catechism"]').click();
    
    // Entrar em uma parte para ver as seções
    await page.click('text=Prólogo');

    // Abrir uma seção
    const secao1 = page.locator('[data-testid="secao-1"]');
    await secao1.click();

    // Verificar se a seção está aberta (conteúdo visível)
    const conteudo = page.locator('[data-testid="secao-1-conteudo"]');
    await expect(conteudo).toBeVisible();

    // Verificar que as animações estão desativadas (transition-duration: 0s)
    const duration = await conteudo.evaluate(el => window.getComputedStyle(el).transitionDuration);
    expect(duration).toBe('0s');

    // Voltar para o sumário (fechar a seção)
    await page.click('text=Sumário');

    // Verificar se a seção está "fechada" (o conteúdo de leitura não deve existir mais no DOM ou estar oculto)
    await expect(conteudo).not.toBeVisible();
    await expect(page.locator('[data-testid="secao-1"]')).toBeVisible();

    // Recarregar a página e verificar se a preferência persiste
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/reduce-animations/);
  });

  test('remove a classe e restaura animações ao desligar a preferência', async ({ page }) => {
    await abrirPainelAcessibilidade(page);

    // Ativar primeiro
    const toggle = page.locator('[data-testid="reducao-movimento-toggle"]');
    const isChecked = await toggle.getAttribute('aria-checked');
    
    if (isChecked !== 'true') {
      await toggle.click();
    }
    await expect(page.locator('html')).toHaveClass(/reduce-animations/);

    // Desligar
    await toggle.click();
    
    // Verificar se a classe foi removida
    await expect(page.locator('html')).not.toHaveClass(/reduce-animations/);

    // Fechar painel
    await page.mouse.click(0, 0);
    await page.waitForTimeout(300);

    // Navegar para o Catecismo e verificar se as animações voltaram ao padrão
    // Nota: O padrão pode ser o valor definido no CSS (ex: 300ms ou similar)
    await page.locator('[data-testid="nav-catechism"]').click();
    await page.click('text=Prólogo');
    
    const secao1 = page.locator('[data-testid="secao-1"]');
    await secao1.click();
    
    const conteudo = page.locator('[data-testid="secao-1-conteudo"]');
    await expect(conteudo).toBeVisible();

    const duration = await conteudo.evaluate(el => window.getComputedStyle(el).transitionDuration);
    // Verifica se NÃO é '0s' (ou '0ms'), indicando que há animação
    expect(duration).not.toBe('0s');
    expect(duration).not.toBe('0ms');
  });
});
