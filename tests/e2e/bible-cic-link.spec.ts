import { test, expect } from '@playwright/test';

/**
 * Link "Abrir §N no Catecismo" a partir da Bíblia (Jo 6):
 *  - Navega para /catechism?p=N na mesma aba
 *  - Página carrega conteúdo válido (não fica em branco)
 *  - Console registra a instrumentação do clique
 */

test('CIC link a partir de Jo 6 navega para /catechism?p=N com conteúdo', async ({ context, page }) => {
  type CicLog = { text: string; args: any[] };
  const logs: CicLog[] = [];
  page.on('console', async (msg) => {
    if (!msg.text().includes('[CIC link click]')) return;
    try {
      const args = await Promise.all(msg.args().map((a) => a.jsonValue().catch(() => null)));
      logs.push({ text: msg.text(), args });
    } catch {
      logs.push({ text: msg.text(), args: [] });
    }
  });

  const startPath = '/bible?book=Jo&ch=6';
  await page.goto(startPath);
  await page.waitForLoadState('domcontentloaded');

  const cicLink = page
    .locator('[data-testid="catechism-preview-empty-link"], [data-testid="catechism-open-internal"]')
    .first();

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

  // Mesma aba: target ausente ou _self
  const target = await cicLink.getAttribute('target');
  expect(target === null || target === '_self').toBeTruthy();

  const pagesBefore = context.pages().length;

  await cicLink.click();
  await page.waitForURL(new RegExp(`/catechism\\?p=${paragraph}`), { timeout: 10_000 });

  // Não abriu nova aba
  expect(context.pages().length).toBe(pagesBefore);

  // Conteúdo válido: main não vazio
  const mainText = await page.locator('main').first().innerText();
  expect(mainText.trim().length).toBeGreaterThan(20);

  // Console registrou a instrumentação com payload correto
  expect(logs.length).toBeGreaterThan(0);
  const payload = logs.find((l) => l.args.some((a) => a && typeof a === 'object' && 'href' in a))?.args
    .find((a: any) => a && typeof a === 'object' && 'href' in a) as
    | { origin?: string; paragraph?: number | string; href?: string; from?: string }
    | undefined;

  expect(payload, 'log payload com href/origin/from').toBeTruthy();
  expect(String(payload!.origin || '')).toMatch(/CatechismPopover|Bible|Preview/i);
  expect(String(payload!.href || '')).toMatch(new RegExp(`/catechism\\?p=${paragraph}`));
  expect(Number(payload!.paragraph)).toBe(Number(paragraph));
  expect(String(payload!.from || '')).toContain('/bible');
  expect(String(payload!.from || '')).toContain('book=Jo');
  expect(String(payload!.from || '')).toContain('ch=6');
});
