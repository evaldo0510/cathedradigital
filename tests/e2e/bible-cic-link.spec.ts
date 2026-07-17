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

  // Nenhuma nova aba/popup deve ser aberta durante todo o fluxo
  const popups: string[] = [];
  context.on('page', (p) => popups.push(p.url()));
  page.on('popup', (p) => popups.push('popup:' + p.url()));



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

  // Sentinela SPA: se o documento recarregar, esta flag é perdida.
  // Também escutamos o evento `beforeunload` para detectar full reload.
  await page.evaluate(() => {
    (window as any).__SPA_SENTINEL__ = 'jo6-cic-' + Date.now();
    (window as any).__SPA_UNLOADED__ = false;
    window.addEventListener('beforeunload', () => {
      (window as any).__SPA_UNLOADED__ = true;
    });
  });
  const sentinelBefore = await page.evaluate(() => (window as any).__SPA_SENTINEL__);

  await cicLink.click();
  await page.waitForURL(new RegExp(`/catechism\\?p=${paragraph}`), { timeout: 10_000 });

  // Não abriu nova aba
  expect(context.pages().length).toBe(pagesBefore);

  // Mesmo documento: sentinela preserva valor e beforeunload não disparou
  const sentinelAfter = await page.evaluate(() => (window as any).__SPA_SENTINEL__);
  const unloaded = await page.evaluate(() => (window as any).__SPA_UNLOADED__);
  expect(sentinelAfter, 'documento SPA preservado (sem reload)').toBe(sentinelBefore);
  expect(unloaded, 'nenhum beforeunload disparou').toBe(false);

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

  // Landmarks + heading corretos em /catechism?p=N
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('nav').first()).toBeVisible();
  const headings = page.locator('h1, h2');
  await expect(headings.first()).toBeVisible();
  const headingText = (await headings.allInnerTexts()).join(' \n ');
  expect(headingText).toMatch(new RegExp(`(§\\s*)?${paragraph}\\b|Catecismo`, 'i'));

  // Parágrafo N visível na página (marcador semântico ou texto)
  const paragraphMarker = page
    .locator(
      `[data-paragraph="${paragraph}"], [data-cic-paragraph="${paragraph}"], #p-${paragraph}, #paragraph-${paragraph}`
    )
    .first();
  if (await paragraphMarker.count()) {
    await expect(paragraphMarker).toBeVisible();
  } else {
    await expect(page.locator('main')).toContainText(new RegExp(`§\\s*${paragraph}\\b`));
  }

  // Nenhuma nova aba/popup foi aberta em todo o fluxo até aqui
  expect(popups, 'nenhum popup/nova aba durante o fluxo').toEqual([]);
  expect(context.pages().length).toBe(pagesBefore);

  // Reload preserva o parágrafo N e não emite novo log de [CIC link click]
  const logsBeforeReload = logs.length;
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(new RegExp(`/catechism\\?p=${paragraph}`));

  const markerAfter = page
    .locator(
      `[data-paragraph="${paragraph}"], [data-cic-paragraph="${paragraph}"], #p-${paragraph}, #paragraph-${paragraph}`
    )
    .first();
  if (await markerAfter.count()) {
    await expect(markerAfter).toBeVisible();
  } else {
    await expect(page.locator('main')).toContainText(new RegExp(`§\\s*${paragraph}\\b`));
  }

  // Nenhum novo log de clique CIC após o reload (não houve novo clique)
  await page.waitForTimeout(500);
  expect(logs.length, 'nenhum [CIC link click] extra após reload').toBe(logsBeforeReload);
});
