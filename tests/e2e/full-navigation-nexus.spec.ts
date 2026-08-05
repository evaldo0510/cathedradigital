import { test, expect } from '@playwright/test';

test.describe('Navegação Completa de Jornadas (Nexus)', () => {
  test('Fluxo: Jornada -> Santo -> Catecismo -> Bíblia -> Jornada', async ({ page }) => {
    // 1. Acessar uma jornada
    await page.goto('/jornadas/coracao-inquieto'); 
    await expect(page.locator('h1')).toBeVisible();

    // 2. Navegar para o primeiro passo
    await page.click('text=Começar');
    await expect(page.url()).toContain('/step');

    // 3. Verificar NexusPanel e continuidade para um Santo
    const nexusPanel = page.locator('[data-nexus-panel]');
    await expect(nexusPanel).toBeVisible();
    
    // Supondo que Santo Agostinho esteja no Nexus
    await page.click('[data-nexus-bucket="saints"] a, [data-nexus-type="saints"] a, text="Santo Agostinho"');
    await expect(page.url()).toContain('/santos/agostinho');

    // 4. Do Santo para o Catecismo via Nexus
    await expect(page.locator('[data-nexus-panel]')).toBeVisible();
    await page.click('[data-nexus-bucket="catechism"] a, text="CIC"');
    await expect(page.url()).toContain('/catechism');

    // 5. Do Catecismo para a Bíblia via ReaderContinuation
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const continuation = page.locator('[data-reader-continuation]');
    await expect(continuation).toBeVisible();
    await page.click('[data-reader-continuation] a:has-text("Bíblia")');
    await expect(page.url()).toContain('/bible');

    // 6. Testar botão "Voltar" sem quebrar links
    await page.goBack();
    await expect(page.url()).toContain('/catechism');
    await page.goBack();
    await expect(page.url()).toContain('/santos/agostinho');
  });
});
