import { test, expect, type Page, type Route } from '@playwright/test';

/**
 * Cenário:
 *  1. Carrega o calendário e cacheia o mês atual + o seguinte (navegação).
 *  2. Captura o número de chamadas à edge function.
 *  3. Clica em "Remover" no mês atual → painel pede confirmação.
 *  4. Cancela primeiro → garante que NADA foi apagado.
 *  5. Clica novamente, confirma → mês some do IndexedDB, métricas atualizam
 *     e nenhuma nova chamada de rede é disparada.
 *  6. O painel exibe o resumo do que foi apagado.
 */

const CAL_ROUTE = '/calendar?litcal_no_prefetch=1';

async function mockMonthEndpoint(page: Page) {
  const calls: Array<{ year: number; month: number; at: number }> = [];
  await page.route('**/functions/v1/liturgical-calendar', async (route: Route) => {
    const req = route.request();
    let body: any = {};
    try { body = req.postDataJSON?.() ?? JSON.parse(req.postData() || '{}'); } catch { /* */ }
    calls.push({ year: Number(body.year), month: Number(body.month), at: Date.now() });
    if (body.action !== 'month') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    const y = Number(body.year);
    const m = Number(body.month);
    const days = Array.from({ length: new Date(y, m, 0).getDate() }, (_, i) => ({
      date: `${y}-${String(m).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
      season: 'ordinary',
      celebrations: [{ title: `T ${y}-${m}-${i + 1}`, colour: 'green', rank: 'ferial' }],
    }));
    await route.fulfill({
      status: 200, contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(days),
    });
  });
  return { calls };
}

async function waitFor(cond: () => boolean | Promise<boolean>, timeout = 10_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await cond()) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error('waitFor: timeout');
}

async function listIdbKeys(page: Page): Promise<string[]> {
  return page.evaluate<string[]>(async () => {
    return await new Promise<string[]>((resolve) => {
      const req = indexedDB.open('cathedra_cache');
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('liturgical-calendar', 'readonly');
        const getAllKeys = tx.objectStore('liturgical-calendar').getAllKeys();
        getAllKeys.onsuccess = () => resolve((getAllKeys.result as IDBValidKey[]).map(String));
        getAllKeys.onerror = () => resolve([]);
      };
      req.onerror = () => resolve([]);
    });
  });
}

test.describe('Cache do calendário · botão "Remover" por mês', () => {
  test('apaga a entrada do IndexedDB e atualiza métricas sem refetch', async ({ page }) => {
    const { calls } = await mockMonthEndpoint(page);

    await page.goto('/');
    await page.evaluate(() => window.localStorage.removeItem('cathedra_litcal_stats'));
    await page.goto(CAL_ROUTE);
    await expect(page.getByTestId('liturgical-calendar-cache-panel')).toBeVisible({ timeout: 15_000 });

    // Carrega mês atual + próximo para garantir ≥ 2 entradas
    await waitFor(() => calls.length >= 1);
    const initialAfterLoad = calls.length;
    const nextBtn = page.locator('.lg\\:col-span-2 button').nth(2);
    await nextBtn.click();
    await waitFor(() => calls.length >= initialAfterLoad + 1);
    const prevBtn = page.locator('.lg\\:col-span-2 button').first();
    await prevBtn.click();

    // Aguarda entradas aparecerem no painel e captura uma chave concreta
    await waitFor(async () => (await page.locator('[data-testid^="litcal-cache-entry-"]').count()) >= 2);

    let keysBefore = await listIdbKeys(page);
    expect(keysBefore.length).toBeGreaterThanOrEqual(2);
    const targetKey = keysBefore[0];
    const m = /:(\d{4})-(\d{2})$/.exec(targetKey)!;
    const year = m[1];
    const month = m[2];
    const suffix = `${year}-${month}`;
    const removeBtn = page.getByTestId(`litcal-cache-entry-remove-${suffix}`);
    await expect(removeBtn).toBeVisible();

    const callsBeforeRemove = calls.length;

    // 1ª etapa: clica "Remover" → confirmação aparece, nada foi apagado
    await removeBtn.click();
    const confirmYes = page.getByTestId(`litcal-cache-entry-confirm-yes-${suffix}`);
    const confirmNo = page.getByTestId(`litcal-cache-entry-confirm-no-${suffix}`);
    await expect(confirmYes).toBeVisible();
    await expect(confirmNo).toBeVisible();
    let keysMid = await listIdbKeys(page);
    expect(keysMid).toEqual(keysBefore);

    // Cancela → estado volta ao normal, sem deletar
    await confirmNo.click();
    await expect(confirmYes).toHaveCount(0);
    keysMid = await listIdbKeys(page);
    expect(keysMid).toEqual(keysBefore);

    // 2ª tentativa: confirma de fato
    await removeBtn.click();
    await expect(confirmYes).toBeVisible();
    await confirmYes.click();

    // Aguarda IDB ficar sem a chave
    await waitFor(async () => {
      const ks = await listIdbKeys(page);
      return !ks.includes(targetKey);
    });
    const keysAfter = await listIdbKeys(page);
    expect(keysAfter).not.toContain(targetKey);
    expect(keysAfter.length).toBe(keysBefore.length - 1);

    // Linha some do painel
    await expect(page.getByTestId(`litcal-cache-entry-${suffix}`)).toHaveCount(0);

    // Resumo é exibido com o label do mês removido
    const summary = page.getByTestId('litcal-cache-summary');
    await expect(summary).toBeVisible();
    await expect(summary).toContainText(/\w{3}\/\d{4}/);

    // E o mais importante: NENHUMA nova chamada à edge function foi feita por causa do delete
    expect(calls.length).toBe(callsBeforeRemove);
  });
});
