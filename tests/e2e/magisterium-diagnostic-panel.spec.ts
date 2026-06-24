import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

/**
 * Smoke + contrato do modo diagnóstico do Magistério.
 *
 * - /magisterium/:id?debug=1 ativa o painel `magisterium-diagnostic-panel`
 * - A timeline registra `cache_hit` ou `fetch_ok` para o documento
 * - Não há `final_error` no cenário feliz
 * - Botão "Exportar JSON" emite arquivo conforme contrato
 *   (`counts`, `lastError`, `timeline[]` com `step`/`ts`/`docId`)
 * - A timeline persiste em localStorage e rehidrata ao recarregar
 */

const KNOWN_DOC = 'ls'; // Laudato Si' — id estável listado em Magisterium.tsx

const HAPPY_STEPS = new Set(['cache_hit', 'fetch_ok']);
const KNOWN_STEPS = [
  'cache_hit', 'cache_thin', 'fetch_ok', 'fetch_thin',
  'fetch_404', 'fetch_error', 'final_error',
];

test.describe('Magisterium · modo diagnóstico', () => {
  test('painel, timeline, export JSON e rehidratação', async ({ page }, testInfo) => {
    // Pre-arma o flag para casos em que o redirect descarte o querystring
    await page.goto('/');
    await page.evaluate(() =>
      window.localStorage.setItem('cathedra_magisterium_debug', '1'),
    );

    await page.goto(`/magisterium/${KNOWN_DOC}?debug=1`);

    const panel = page.getByTestId('magisterium-diagnostic-panel');
    await expect(panel).toBeVisible({ timeout: 12_000 });

    // Aguarda a timeline conter pelo menos um cache_hit ou fetch_ok
    await expect
      .poll(
        async () =>
          (await panel.locator('text=/cache_hit|fetch_ok/').count()) > 0,
        { timeout: 15_000, message: 'timeline deve conter cache_hit ou fetch_ok' },
      )
      .toBeTruthy();

    expect(await panel.locator('text=final_error').count()).toBe(0);

    await testInfo.attach('magisterium-panel.png', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });

    // ----------------------- Export JSON + contrato -----------------------
    const exportBtn = page.getByTestId('magisterium-diagnostic-export');
    await expect(exportBtn).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportBtn.click(),
    ]);

    expect(download.suggestedFilename()).toMatch(
      /^magisterium-diagnostic-\d+\.json$/,
    );
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
      route: expect.stringContaining('/magisterium'),
      counts: { buffer: expect.any(Number), persisted: expect.any(Number) },
      timeline: expect.any(Array),
      persistedErrors: expect.any(Array),
    });
    expect(new Date(report.generatedAt).toString()).not.toBe('Invalid Date');

    // Counts coerentes
    expect(report.counts.buffer).toBeGreaterThan(0);
    expect(report.counts.persisted).toBe(report.persistedErrors.length);

    // Cenário feliz: nenhum erro persistido para este docId
    expect(report.lastError).toBeNull();

    // Cada evento da timeline obedece ao contrato
    for (const ev of report.timeline) {
      expect(typeof ev.ts).toBe('number');
      expect(KNOWN_STEPS).toContain(ev.step);
    }

    // Pelo menos um evento "feliz" (cache_hit ou fetch_ok) no payload
    expect(
      report.timeline.some((e: any) => HAPPY_STEPS.has(e.step)),
    ).toBe(true);

    // ----------------------- Rehidratação ---------------------------------
    const bufferBefore = report.counts.buffer;
    await page.reload();
    await expect(panel).toBeVisible({ timeout: 8_000 });

    // O contador "Eventos" mostra X / persist: Y — basta confirmar que
    // após reload o buffer não zerou (persistiu em localStorage).
    const eventosTxt = await panel.locator('text=/persist:/').first().innerText();
    const match = eventosTxt.match(/(\d+)\s*\/\s*persist:\s*(\d+)/);
    expect(match).not.toBeNull();
    const bufferAfter = Number(match![1]);
    expect(bufferAfter).toBeGreaterThanOrEqual(bufferBefore);
  });
});
