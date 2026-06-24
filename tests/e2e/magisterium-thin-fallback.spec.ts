import { test, expect } from '@playwright/test';

/**
 * Magisterium · fallback de conteúdo "thin" (<500 chars)
 *
 * Cenário:
 * - Interceptamos a edge function `vatican-document` e devolvemos um payload
 *   com `text` curto (~120 chars), simulando uma página de redirect do
 *   vatican.va que escapa do MIN_DOC_LEN do MagisteriumViewer.
 *
 * Garantias:
 * - O viewer entra no estado de erro recuperável (`magisterium-error-fallback`).
 * - O botão "Tentar novamente" aparece (`magisterium-retry`).
 * - O link externo canônico aparece com `href` apontando para vatican.va
 *   (`magisterium-external-fallback`, `target=_blank`, `rel` seguro).
 * - O painel de diagnóstico registra um `final_error` recuperável e nenhum
 *   evento `fetch_ok` para este docId.
 * - Após clicar em "Tentar novamente", a edge é chamada novamente
 *   (incrementa o contador de hits) e o estado volta a ser de erro
 *   (porque o stub continua devolvendo conteúdo curto).
 */

const DOC_ID = 'ls'; // Laudato Si'
const CANONICAL_HOST = 'vatican.va';
const THIN_TEXT = 'Documento muito curto, provavelmente redirect.';

test.describe('Magisterium · fallback thin/recuperável', () => {
  test('thin response → erro recuperável + retry + link canônico', async ({ page }, testInfo) => {
    let hits = 0;

    // Stub da edge function: SDK supabase faz POST em /functions/v1/vatican-document
    await page.route('**/functions/v1/vatican-document', async (route) => {
      hits += 1;
      await route.fulfill({
        status: 206,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          title: 'Laudato Si (thin stub)',
          text: THIN_TEXT,
          meta: { step: 'fetch_thin', content_length: THIN_TEXT.length },
        }),
      });
    });

    // Ativa diagnóstico antes da rota destino
    await page.goto('/');
    await page.evaluate(() =>
      window.localStorage.setItem('cathedra_magisterium_debug', '1'),
    );

    await page.goto(`/magisterium/${DOC_ID}?debug=1`);

    // 1) Fallback recuperável visível
    const fallback = page.getByTestId('magisterium-error-fallback');
    await expect(fallback).toBeVisible({ timeout: 15_000 });

    // 2) Botão "Tentar novamente" presente e com label PT-BR
    const retry = page.getByTestId('magisterium-retry');
    await expect(retry).toBeVisible();
    await expect(retry).toContainText(/Tentar novamente/i);

    // 3) Link externo para a URL canônica do vatican.va
    const external = page.getByTestId('magisterium-external-fallback');
    await expect(external).toBeVisible();
    const href = await external.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href!).toContain(CANONICAL_HOST);
    expect(href!).toMatch(/^https:\/\//);
    await expect(external).toHaveAttribute('target', '_blank');
    const rel = (await external.getAttribute('rel')) ?? '';
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');

    // 4) Painel de diagnóstico registra final_error e sem fetch_ok para este doc
    const panel = page.getByTestId('magisterium-diagnostic-panel');
    await expect(panel).toBeVisible();
    await expect.poll(() => panel.locator('text=final_error').count(), {
      timeout: 8_000,
      message: 'timeline deve registrar final_error',
    }).toBeGreaterThan(0);
    expect(await panel.locator('text=fetch_ok').count()).toBe(0);

    await testInfo.attach('magisterium-thin-fallback.png', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });

    // 5) Retry dispara nova invocação à edge function (idempotente: continua thin)
    const hitsBeforeRetry = hits;
    await retry.click();
    await expect.poll(() => hits, {
      timeout: 8_000,
      message: 'retry deve refazer chamada à edge function',
    }).toBeGreaterThan(hitsBeforeRetry);

    // Volta ao mesmo fallback (conteúdo segue thin)
    await expect(page.getByTestId('magisterium-error-fallback')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId('magisterium-retry')).toBeVisible();
    await expect(page.getByTestId('magisterium-external-fallback')).toBeVisible();
  });
});
