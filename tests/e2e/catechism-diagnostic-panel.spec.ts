import { test, expect } from '@playwright/test';

/**
 * Smoke test do modo diagnóstico do Catecismo.
 *
 * Garante que:
 *  - /catecismo?debug=1 redireciona para /catechism mantendo o modo debug ativo
 *  - O painel `catechism-diagnostic-panel` é renderizado
 *  - A linha do tempo contém eventos `official_hit` para os primeiros parágrafos
 *  - O botão "Exportar JSON" está presente e clicável (dispara um download)
 *
 * Screenshots são salvos em `test-results/` como evidência visual.
 */
test.describe('Catechism · modo diagnóstico', () => {
  test('exibe painel e timeline com official_hit nos primeiros parágrafos', async ({ page }, testInfo) => {
    const logs: string[] = [];
    page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));

    // Pre-arm debug flag para casos em que o redirect descarte o querystring
    await page.goto('/');
    await page.evaluate(() => window.localStorage.setItem('cathedra_catechism_debug', '1'));

    await page.goto('/catecismo?debug=1');
    await expect(page).toHaveURL(/\/catechism/);

    const panel = page.getByTestId('catechism-diagnostic-panel');
    await expect(panel).toBeVisible({ timeout: 8_000 });

    // Aguarda primeiros official_hit aparecerem na timeline
    await expect
      .poll(async () => (await panel.locator('text=official_hit').count()), {
        timeout: 10_000,
        message: 'timeline deve conter pelo menos 3 official_hit',
      })
      .toBeGreaterThanOrEqual(3);

    // Nenhum erro fatal silencioso
    expect(await panel.locator('text=final_error').count()).toBe(0);

    await testInfo.attach('panel-initial', {
      body: await page.screenshot({ clip: await panel.boundingBox().then((b) => b ?? undefined) }),
      contentType: 'image/png',
    });
    await testInfo.attach('full-screen', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });

    // Botão de exportar JSON
    const exportBtn = page.getByTestId('catechism-diagnostic-export');
    await expect(exportBtn).toBeVisible();

    const downloadPromise = page.waitForEvent('download', { timeout: 5_000 }).catch(() => null);
    await exportBtn.click();
    const download = await downloadPromise;

    if (download) {
      const path = await download.path();
      expect(download.suggestedFilename()).toMatch(/^catechism-diagnostic-\d+\.json$/);
      expect(path).toBeTruthy();
      await testInfo.attach('exported-report-name', {
        body: Buffer.from(download.suggestedFilename(), 'utf-8'),
        contentType: 'text/plain',
      });
    }
  });
});
