import { test, expect } from '@playwright/test';

/**
 * Link "Abrir §N no Catecismo" a partir da Bíblia (Jo 6):
 *  - Navega para /catechism?p=N na mesma aba
 *  - Página carrega conteúdo válido (não fica em branco)
 *  - Console registra a instrumentação do clique
 */

test('CIC link a partir de Jo 6 navega para /catechism?p=N com conteúdo', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', (msg) => {
    if (msg.text().includes('[CIC link click]')) logs.push(msg.text());
  });

  await page.goto('/bible?book=Jo&ch=6');
  await page.waitForLoadState('domcontentloaded');

  // Espera qualquer link de abertura do Catecismo na página (preview vazio ou popover)
  const cicLink = page
    .locator('[data-testid="catechism-preview-empty-link"], [data-testid="catechism-open-internal"]')
    .first();

  // Se a página não expõe imediatamente, tenta abrir um trigger nexus
  if (!(await cicLink.count())) {
    const trigger = page.locator('[data-nexus-trigger], [data-testid^="nexus-trigger"]').first();
    if (await trigger.count()) {
      await trigger.click();
    }
  }

  await expect(cicLink).toBeVisible({ timeout: 20_000 });

  const href = await cicLink.getAttribute('href');
  expect(href).toMatch(/\/catechism\?p=\d+/);
  const paragraph = href!.match(/p=(\d+)/)![1];

  // Nada de nova aba: garantir target não é _blank
  const target = await cicLink.getAttribute('target');
  expect(target === null || target === '_self').toBeTruthy();

  await cicLink.click();
  await page.waitForURL(new RegExp(`/catechism\\?p=${paragraph}`), { timeout: 10_000 });

  // Conteúdo válido: main não vazio
  const mainText = await page.locator('main').first().innerText();
  expect(mainText.trim().length).toBeGreaterThan(20);

  // Console registrou a instrumentação
  expect(logs.some((l) => l.includes('[CIC link click]'))).toBe(true);
});
