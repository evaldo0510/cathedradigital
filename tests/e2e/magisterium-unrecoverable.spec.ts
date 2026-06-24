import { test, expect } from '@playwright/test';

/**
 * Magisterium · cap de retries → modo não-recuperável
 *
 * Cenário: a edge function continua devolvendo conteúdo abaixo do mínimo
 * legível (thin). Após MAX_RETRIES (3) tentativas — ou seja, 3 cliques no
 * botão "Tentar novamente" além da carga inicial — o fallback entra em
 * modo não-recuperável:
 *
 * - O botão "Tentar novamente" desaparece (não há reenvio indefinido)
 * - O painel mostra mensagem final clara `magisterium-unrecoverable-message`
 * - O atributo `data-unrecoverable="true"` é refletido na raiz do fallback
 * - O link externo canônico permanece como saída segura
 * - A edge function não é mais chamada após o limite
 */

const DOC_ID = 'ls';
const THIN = 'curto.';
const MAX_RETRIES = 3;

test('Magisterium · não reenvia além do limite e exibe mensagem final', async ({ page }) => {
  let hits = 0;
  await page.route('**/functions/v1/vatican-document', async (route) => {
    hits += 1;
    await route.fulfill({
      status: 206,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ title: 'thin', text: THIN, meta: { step: 'fetch_thin' } }),
    });
  });

  await page.goto(`/magisterium/${DOC_ID}`);
  const fallback = page.getByTestId('magisterium-error-fallback');
  await expect(fallback).toBeVisible({ timeout: 15_000 });

  // Carga inicial conta como 1ª falha
  await expect.poll(() => fallback.getAttribute('data-failure-count'))
    .toBe('1');

  // Clica retry até bater o cap
  for (let i = 2; i <= MAX_RETRIES; i++) {
    const retry = page.getByTestId('magisterium-retry');
    await expect(retry).toBeVisible();
    await retry.click();
    await expect.poll(() => fallback.getAttribute('data-failure-count'), { timeout: 8_000 })
      .toBe(String(i));
  }

  // Estado terminal: botão de retry sumiu, mensagem final aparece
  await expect(fallback).toHaveAttribute('data-unrecoverable', 'true');
  await expect(page.getByTestId('magisterium-retry')).toHaveCount(0);
  const finalMsg = page.getByTestId('magisterium-unrecoverable-message');
  await expect(finalMsg).toBeVisible();
  await expect(finalMsg).toContainText(/não-recuperável/i);

  // Saída segura: link canônico ainda disponível
  const ext = page.getByTestId('magisterium-external-fallback');
  await expect(ext).toBeVisible();
  expect(await ext.getAttribute('href')).toContain('vatican.va');

  // Não há mais reenvio automático
  const finalHits = hits;
  await page.waitForTimeout(1500);
  expect(hits).toBe(finalHits);
});
