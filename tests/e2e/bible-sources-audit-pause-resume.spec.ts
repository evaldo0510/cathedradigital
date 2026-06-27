import { test, expect } from '@playwright/test';

/**
 * E2E — Controles de Pausar/Retomar do "Re-tentar lote" em /admin/bible-sources.
 *
 * Estes testes navegam até a página de auditoria e validam:
 *  - O modal de confirmação aparece ao clicar em Pausar/Retomar.
 *  - O banner "Workers pausados" aparece quando o estado é pausado.
 *  - Os workers efetivamente respeitam a pausa (não há progresso).
 *
 * Se a página exigir login de admin e o ambiente não tiver sessão pronta,
 * os testes são pulados (skip) para não gerar falsos negativos no CI.
 */

const ADMIN_URL = '/admin/bible-sources';

async function ensureOnAuditPage(page: import('@playwright/test').Page) {
  await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded' });
  // Caso seja redirecionado para login, sinalizar skip.
  const heading = page.getByRole('heading', { name: /Auditoria de Fontes/i });
  const visible = await heading.isVisible().catch(() => false);
  if (!visible) {
    test.skip(true, 'Página requer admin autenticado (sessão indisponível neste runner).');
  }
}

test.describe('BibleSourcesAudit — Pausar/Retomar', () => {
  test.beforeEach(async ({ page }) => {
    await ensureOnAuditPage(page);
  });

  test('modal de confirmação aparece ao clicar em Pausar (durante lote)', async ({ page }) => {
    // O botão Pausar só aparece com batchRunning=true. Esta verificação é
    // dependente de dados reais — se não houver capítulos indisponíveis,
    // o botão "Re-tentar lote" estará desabilitado e devemos pular.
    const batchBtn = page.getByRole('button', { name: /Re-tentar lote/i });
    await expect(batchBtn).toBeVisible();
    if (await batchBtn.isDisabled()) {
      test.skip(true, 'Sem capítulos indisponíveis para iniciar lote no ambiente atual.');
    }

    await batchBtn.click();

    const pauseBtn = page.getByRole('button', { name: /^Pausar$/ });
    await expect(pauseBtn).toBeVisible({ timeout: 5000 });
    await pauseBtn.click();

    // AlertDialog de confirmação
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Pausar workers do lote\?/i }),
    ).toBeVisible();

    // Confirmar pausa
    await page.getByRole('button', { name: /^Pausar$/ }).last().click();

    // Banner de pausado deve aparecer
    const banner = page.getByTestId('batch-paused-banner');
    await expect(banner).toBeVisible({ timeout: 5000 });
    await expect(banner).toContainText(/Workers pausados/i);

    // Snapshot do progresso atual: nada deve avançar enquanto pausado.
    const doneCell = page.getByTestId('batch-progress-done');
    const beforeText = await doneCell.textContent();
    await page.waitForTimeout(1500);
    const afterText = await doneCell.textContent();
    expect(afterText).toBe(beforeText);

    // Retomar
    await page.getByRole('button', { name: /^Retomar$/ }).first().click();
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.getByRole('button', { name: /^Retomar$/ }).last().click();
    await expect(page.getByTestId('batch-paused-banner')).toBeHidden({ timeout: 5000 });
  });
});
