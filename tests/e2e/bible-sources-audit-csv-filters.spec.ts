import { test, expect } from '@playwright/test';

/**
 * E2E — Filtros, busca e download CSV nas tabelas "Última tentativa por capítulo"
 * e "Log de tentativas" da página /admin/bible-sources.
 *
 * Os testes saltam (skip) automaticamente quando:
 *  - a página não está acessível (login admin ausente);
 *  - não há dados de tentativas/log na sessão atual.
 */

const ADMIN_URL = '/admin/bible-sources';

async function ensureOnAuditPage(page: import('@playwright/test').Page) {
  await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded' });
  const heading = page.getByRole('heading', { name: /Auditoria de Fontes/i });
  const visible = await heading.isVisible().catch(() => false);
  if (!visible) {
    test.skip(true, 'Página requer admin autenticado (sessão indisponível).');
  }
}

test.describe('BibleSourcesAudit — Última tentativa por capítulo', () => {
  test.beforeEach(async ({ page }) => {
    await ensureOnAuditPage(page);
  });

  test('busca por capítulo filtra a tabela e o contador', async ({ page }) => {
    const card = page.locator('text=Última tentativa por capítulo').first();
    if (!(await card.isVisible().catch(() => false))) {
      test.skip(true, 'Sem dados de "Última tentativa" no ambiente.');
    }

    const search = page.getByPlaceholder('Buscar capítulo (ex: Gn:3)');
    await search.fill('ZZZ:999');
    await expect(
      page.getByText('Nenhum resultado para os filtros atuais.').first(),
    ).toBeVisible({ timeout: 3000 });

    await search.fill('');
  });

  test('filtro de status HTTP altera o conjunto exibido', async ({ page }) => {
    const card = page.locator('text=Última tentativa por capítulo').first();
    if (!(await card.isVisible().catch(() => false))) {
      test.skip(true, 'Sem dados de "Última tentativa".');
    }

    // Seleciona "HTTP 5xx": a tabela deve ou ficar vazia (estado válido) ou
    // exibir apenas badges com status >= 500.
    const select = page
      .locator('button[role="combobox"]')
      .filter({ hasText: /Todos|HTTP|Sucesso|Falha/ })
      .first();
    await select.click();
    await page.getByRole('option', { name: 'HTTP 5xx' }).click();

    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).textContent();
      if (text && /HTTP/i.test(text)) {
        // confirma que o badge é >=500
        expect(text).toMatch(/5\d{2}/);
      }
    }
  });

  test('botão CSV dispara download', async ({ page }) => {
    const card = page.locator('text=Última tentativa por capítulo').first();
    if (!(await card.isVisible().catch(() => false))) {
      test.skip(true, 'Sem dados de "Última tentativa".');
    }

    const csvButton = page
      .getByRole('button', { name: /^CSV$/ })
      .first();
    if (await csvButton.isDisabled()) {
      test.skip(true, 'CSV indisponível: nenhum registro após filtros.');
    }

    const downloadPromise = page.waitForEvent('download', { timeout: 5000 });
    await csvButton.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/i);
  });
});

test.describe('BibleSourcesAudit — Log de tentativas', () => {
  test.beforeEach(async ({ page }) => {
    await ensureOnAuditPage(page);
  });

  test('busca em "Buscar alvo" filtra o log', async ({ page }) => {
    const logHeader = page.locator('text=Log de tentativas').first();
    if (!(await logHeader.isVisible().catch(() => false))) {
      test.skip(true, 'Sem log de tentativas no ambiente.');
    }

    const search = page.getByPlaceholder('Buscar alvo');
    await search.fill('___NO_MATCH___');
    await expect(
      page.getByText('Nenhuma entrada para os filtros atuais.').first(),
    ).toBeVisible({ timeout: 3000 });
    await search.fill('');
  });

  test('CSV do log dispara download', async ({ page }) => {
    const logHeader = page.locator('text=Log de tentativas').first();
    if (!(await logHeader.isVisible().catch(() => false))) {
      test.skip(true, 'Sem log de tentativas no ambiente.');
    }

    // O segundo botão "CSV" da página pertence ao card de Log.
    const csvButtons = page.getByRole('button', { name: /^CSV$/ });
    const total = await csvButtons.count();
    if (total < 2) {
      test.skip(true, 'Botão CSV do log não disponível.');
    }
    const logCsv = csvButtons.nth(1);
    if (await logCsv.isDisabled()) {
      test.skip(true, 'CSV do log indisponível.');
    }

    const downloadPromise = page.waitForEvent('download', { timeout: 5000 });
    await logCsv.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/i);
  });
});
