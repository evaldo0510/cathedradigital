import { test, expect } from '@playwright/test';

/**
 * Valida o contrato visual do 404 da edge `bible-text` no frontend:
 * o handler deve exibir um toast com `reason` e `received_abbrev`
 * conforme `BibleTextErrorSchema`, sem depender do conteúdo real da edge.
 *
 * Estratégia: interceptamos qualquer chamada para /functions/v1/bible-text
 * e devolvemos um 404 canônico do schema. Em seguida verificamos o toast
 * renderizado pelo Sonner.
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080';

const errorPayload = {
  error: 'Texto não encontrado',
  reason: 'Abreviação não reconhecida: "xx"',
  received_abbrev: 'xx',
  canonical_abbr: null,
  book_name: null,
  bollsId: null,
  chapter: 1,
  correlationId: 'e2e-frontend-toast',
};

test('Bible UI: toast.error mostra reason + received_abbrev em 404', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));

  // Intercepta ANTES da navegação para pegar o fetch inicial do capítulo padrão.
  await page.route('**/functions/v1/bible-text*', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-headers': '*',
          'access-control-allow-methods': 'POST, OPTIONS',
        },
      });
      return;
    }
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(errorPayload),
    });
  });

  await page.goto(`${BASE_URL}/bible`, { waitUntil: 'domcontentloaded' });

  // Sonner renderiza com role="status" e data-sonner-toast. Esperamos
  // tanto o título quanto a descrição derivada do schema.
  const toast = page.locator('[data-sonner-toast]').filter({ hasText: 'Texto não encontrado' });
  await expect(toast).toBeVisible({ timeout: 15000 });
  await expect(toast).toContainText('Abreviação não reconhecida');
  await expect(toast).toContainText('"xx"');
  // correlationId preservado (proveniente do payload do 404) deve aparecer no toast
  await expect(toast).toContainText('e2e-frontend-toast');

  // Sem erros JS não tratados decorrentes do 404
  expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
});
