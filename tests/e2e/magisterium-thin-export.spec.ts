import { test, expect } from '@playwright/test';

/**
 * Magisterium · export JSON do painel quando em thin/final_error
 *
 * Garante o contrato do JSON exportado quando a edge function devolve
 * conteúdo abaixo do mínimo legível:
 * - `lastError.step === 'final_error'` com `message` não-vazio
 * - `counts.buffer === timeline.length`
 * - `counts.persisted === persistedErrors.length`
 * - Cada item de `timeline[]` traz `ts:number` e `step` em vocabulário conhecido
 * - Pelo menos um evento `fetch_thin` precedendo o `final_error`
 */

const DOC_ID = 'ls';
const THIN_TEXT = 'Documento muito curto, provavelmente redirect.';
const KNOWN_STEPS = [
  'cache_hit', 'cache_thin', 'fetch_ok', 'fetch_thin',
  'fetch_404', 'fetch_error', 'final_error',
];

test('Magisterium · JSON do painel em estado thin/final_error', async ({ page }, testInfo) => {
  await page.route('**/functions/v1/vatican-document', async (route) => {
    await route.fulfill({
      status: 206,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        title: 'Laudato Si (thin)',
        text: THIN_TEXT,
        meta: { step: 'fetch_thin', content_length: THIN_TEXT.length },
      }),
    });
  });

  await page.goto('/');
  await page.evaluate(() =>
    window.localStorage.setItem('cathedra_magisterium_debug', '1'),
  );

  await page.goto(`/magisterium/${DOC_ID}?debug=1`);
  await expect(page.getByTestId('magisterium-error-fallback')).toBeVisible({ timeout: 15_000 });

  const panel = page.getByTestId('magisterium-diagnostic-panel');
  await expect(panel).toBeVisible();
  await expect.poll(() => panel.locator('text=final_error').count(), { timeout: 8_000 })
    .toBeGreaterThan(0);

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('magisterium-diagnostic-export').click(),
  ]);

  const path = await download.path();
  const raw = await (await import('node:fs/promises')).readFile(path!);
  await testInfo.attach(download.suggestedFilename(), {
    body: raw,
    contentType: 'application/json',
  });
  const report = JSON.parse(raw.toString('utf-8'));

  // Shape mínimo
  expect(report).toMatchObject({
    generatedAt: expect.any(String),
    route: expect.stringContaining('/magisterium'),
    counts: { buffer: expect.any(Number), persisted: expect.any(Number) },
    timeline: expect.any(Array),
    persistedErrors: expect.any(Array),
    lastError: expect.objectContaining({
      step: 'final_error',
      ts: expect.any(Number),
      message: expect.any(String),
    }),
  });

  // Consistência: counts.buffer === timeline.length, counts.persisted === persistedErrors.length
  expect(report.counts.buffer).toBe(report.timeline.length);
  expect(report.counts.persisted).toBe(report.persistedErrors.length);
  expect(report.counts.buffer).toBeGreaterThan(0);
  expect(report.lastError.message.length).toBeGreaterThan(0);

  // Vocabulário de steps conhecido
  for (const ev of report.timeline) {
    expect(typeof ev.ts).toBe('number');
    expect(KNOWN_STEPS).toContain(ev.step);
  }

  // Existe ao menos um fetch_thin e ao menos um final_error
  const hasThin = report.timeline.some((e: any) => e.step === 'fetch_thin');
  const hasFinal = report.timeline.some((e: any) => e.step === 'final_error');
  expect(hasThin).toBe(true);
  expect(hasFinal).toBe(true);

  // Persistência inclui o final_error
  expect(report.persistedErrors.some((e: any) => e.step === 'final_error')).toBe(true);
});
