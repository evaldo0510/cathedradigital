import { test, expect } from '@playwright/test';

/**
 * Fluxo Jo 6 → /catechism?p=N com back/forward do navegador:
 *  - Volta preserva a Bíblia em Jo 6
 *  - Avança restaura /catechism?p=N com o mesmo parágrafo selecionado
 *  - Nenhuma nova aba/popup é aberta em qualquer etapa
 */

test('Jo 6 → CIC §N: back/forward preserva parágrafo e sem popups', async ({ context, page }) => {
  const popups: string[] = [];
  context.on('page', (p) => popups.push('page:' + p.url()));
  page.on('popup', (p) => popups.push('popup:' + p.url()));

  await page.goto('/bible?book=Jo&ch=6');
  await page.waitForLoadState('domcontentloaded');

  const cicLink = page
    .locator('[data-testid="catechism-preview-empty-link"], [data-testid="catechism-open-internal"]')
    .first();

  if (!(await cicLink.count())) {
    const trigger = page.locator('[data-nexus-trigger], [data-testid^="nexus-trigger"]').first();
    if (await trigger.count()) await trigger.click();
  }

  await expect(cicLink).toBeVisible({ timeout: 20_000 });
  const href = await cicLink.getAttribute('href');
  expect(href).toMatch(/\/catechism\?p=\d+/);
  const paragraph = href!.match(/p=(\d+)/)![1];

  const pagesBefore = context.pages().length;

  await cicLink.click();
  await page.waitForURL(new RegExp(`/catechism\\?p=${paragraph}`), { timeout: 10_000 });

  async function assertParagraphVisible() {
    const marker = page
      .locator(
        `[data-paragraph="${paragraph}"], [data-cic-paragraph="${paragraph}"], #p-${paragraph}, #paragraph-${paragraph}`
      )
      .first();
    if (await marker.count()) {
      await expect(marker).toBeVisible();
    } else {
      await expect(page.locator('main')).toContainText(new RegExp(`§\\s*${paragraph}\\b`));
    }
  }

  await assertParagraphVisible();

  // Voltar → deve retornar à Bíblia em Jo 6
  await page.goBack();
  await expect(page).toHaveURL(/\/bible\?.*book=Jo.*ch=6/);
  await expect(page.locator('main').first()).toBeVisible();

  // Avançar → volta para /catechism?p=N com o mesmo parágrafo selecionado
  await page.goForward();
  await expect(page).toHaveURL(new RegExp(`/catechism\\?p=${paragraph}`));
  await assertParagraphVisible();

  // Nenhuma nova aba/popup em nenhuma etapa
  expect(popups, 'nenhum popup/nova aba no fluxo back/forward').toEqual([]);
  expect(context.pages().length).toBe(pagesBefore);
});
