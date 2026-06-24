import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

/**
 * Smoke + contrato do modo diagnóstico do Catecismo.
 *
 * - /catecismo?debug=1 redireciona para /catechism mantendo o modo debug ativo
 * - O painel `catechism-diagnostic-panel` é renderizado
 * - Após uma navegação para o §1, a timeline contém `official_hit` para os
 *   primeiros parágrafos e zero `final_error`
 * - O botão "Exportar JSON" gera um arquivo cujo conteúdo respeita o contrato
 *   (`counts`, `lastError`, `timeline[]` com `step`/`paragraph`/`ts`)
 * - A timeline persiste em localStorage e rehidrata ao recarregar
 *
 * Evidências (screenshots + arquivo exportado) são anexadas ao test-report.
 */
test.describe('Catechism · modo diagnóstico', () => {
  test('painel, timeline, export JSON e rehidratação', async ({ page }, testInfo) => {
    // Pre-arm a flag para casos em que o redirect descarte o querystring
    await page.goto('/');
    await page.evaluate(() => window.localStorage.setItem('cathedra_catechism_debug', '1'));

    await page.goto('/catecismo?debug=1');
    await expect(page).toHaveURL(/\/catechism/);

    const panel = page.getByTestId('catechism-diagnostic-panel');
    await expect(panel).toBeVisible({ timeout: 8_000 });

    // Disparar uma carga real de parágrafo via busca (jumpToParagraph)
    const search = page.getByPlaceholder('Buscar por parágrafo (§) ou tema...');
    await search.fill('1');
    await search.press('Enter');

    // Aguarda official_hit aparecer (>= 3 dos 6 parágrafos do batch)
    await expect
      .poll(async () => panel.locator('text=official_hit').count(), {
        timeout: 10_000,
        message: 'timeline deve conter pelo menos 3 official_hit',
      })
      .toBeGreaterThanOrEqual(3);

    expect(await panel.locator('text=final_error').count()).toBe(0);

    await testInfo.attach('panel-reader.png', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });

    // ----------------------- Export JSON + contrato -----------------------
    const exportBtn = page.getByTestId('catechism-diagnostic-export');
    await expect(exportBtn).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportBtn.click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^catechism-diagnostic-\d+\.json$/);
    const path = await download.path();
    expect(path).toBeTruthy();

    const rawBody = await fs.readFile(path!);
    await testInfo.attach(download.suggestedFilename(), {
      body: rawBody,
      contentType: 'application/json',
    });

    const report = JSON.parse(rawBody.toString('utf-8'));

    // Shape do relatório
    expect(report).toMatchObject({
      generatedAt: expect.any(String),
      route: expect.stringContaining('/catechism'),
      counts: { buffer: expect.any(Number), persisted: expect.any(Number) },
      timeline: expect.any(Array),
      persistedErrors: expect.any(Array),
    });
    expect(new Date(report.generatedAt).toString()).not.toBe('Invalid Date');

    // Counts coerentes
    expect(report.counts.buffer).toBeGreaterThanOrEqual(3);
    expect(report.counts.persisted).toBe(report.persistedErrors.length);

    // Sem erros nesse cenário feliz
    expect(report.lastError).toBeNull();
    expect(report.persistedErrors).toEqual([]);

    // Cada evento da timeline obedece ao contrato
    const STEP_VALUES = [
      'cache_hit', 'official_query', 'official_hit', 'official_error',
      'local_hit', 'edge_invoke', 'edge_hit', 'edge_not_found', 'edge_error',
      'fallback_cached', 'unauthorized', 'forbidden', 'final_error',
    ];
    for (const ev of report.timeline) {
      expect(typeof ev.ts).toBe('number');
      expect(typeof ev.paragraph).toBe('number');
      expect(STEP_VALUES).toContain(ev.step);
    }
    // Pelo menos um official_hit no payload exportado
    expect(report.timeline.some((e: any) => e.step === 'official_hit')).toBe(true);

    // ----------------------- Rehidratação ao recarregar ------------------
    const bufferBefore = report.counts.buffer;
    await page.reload();
    await expect(panel).toBeVisible({ timeout: 8_000 });

    // Após reload, a timeline foi rehidratada de localStorage e mantém os
    // eventos anteriores (pode crescer se a primeira batch refizer queries).
    await expect
      .poll(async () => panel.locator('text=official_hit').count(), { timeout: 8_000 })
      .toBeGreaterThanOrEqual(Math.min(bufferBefore, 3));

    await testInfo.attach('panel-after-reload.png', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  });
});
