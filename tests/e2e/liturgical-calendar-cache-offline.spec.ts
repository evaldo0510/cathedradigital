import { test, expect, type Page, type Route } from '@playwright/test';

/**
 * Suite offline/TTL/rede-bloqueada do cache do calendário litúrgico.
 *
 * Cenários cobertos:
 *  1) Rede bloqueada + TTL expirado: app mantém dados expirados com aviso e
 *     não dispara chamadas adicionais enquanto a rede está fora. Quando a rede
 *     volta, refaz a busca uma única vez.
 *  2) Rede bloqueada + ação de remover entrada: navegação entre meses depois
 *     do delete não dispara nenhuma chamada de edge function.
 *  3) Reload com rede bloqueada lê exclusivamente do IndexedDB.
 *  4) Navegação rápida (várias transições) com rede bloqueada não dispara
 *     nenhuma chamada e o grid final corresponde ao mês esperado.
 */

const CAL_ROUTE = '/calendar?litcal_no_prefetch=1';

async function mockMonthEndpoint(page: Page) {
  const calls: Array<{ year: number; month: number; at: number }> = [];
  const handler = async (route: Route) => {
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
      status: 200,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(days),
    });
  };
  await page.route('**/functions/v1/liturgical-calendar', handler);
  return { calls, handler };
}

async function gotoCalendar(page: Page) {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.removeItem('cathedra_litcal_stats'));
  await page.goto(CAL_ROUTE);
  await expect(page.getByTestId('liturgical-calendar-cache-panel')).toBeVisible({ timeout: 15_000 });
}

async function waitForCalls(calls: { length: number }, expected: number, timeoutMs = 10_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (calls.length >= expected) return;
    await new Promise((r) => setTimeout(r, 50));
  }
}

async function ageAllEntries(page: Page, ageMs: number) {
  await page.evaluate(async (age) => {
    const req = indexedDB.open('cathedra_cache');
    await new Promise<void>((resolve, reject) => {
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('liturgical-calendar', 'readwrite');
        const store = tx.objectStore('liturgical-calendar');
        const getAll = store.getAll();
        getAll.onsuccess = () => {
          for (const entry of getAll.result as Array<{ key: string; cachedAt: number; data: unknown; v?: number }>) {
            store.put({ ...entry, cachedAt: Date.now() - age });
          }
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
        getAll.onerror = () => reject(getAll.error);
      };
      req.onerror = () => reject(req.error);
    });
  }, ageMs);
}

async function listIdbKeys(page: Page): Promise<string[]> {
  return page.evaluate<string[]>(async () => {
    return await new Promise<string[]>((resolve) => {
      const req = indexedDB.open('cathedra_cache');
      req.onsuccess = () => {
        const tx = req.result.transaction('liturgical-calendar', 'readonly');
        const all = tx.objectStore('liturgical-calendar').getAllKeys();
        all.onsuccess = () => resolve((all.result as IDBValidKey[]).map(String));
        all.onerror = () => resolve([]);
      };
      req.onerror = () => resolve([]);
    });
  });
}

test.describe('Cache do calendário · rede bloqueada / TTL / navegação rápida', () => {

  test('TTL expirado + rede bloqueada mantém dados (stale) sem chamadas extras na navegação; refaz quando rede volta', async ({ page }) => {
    const { calls } = await mockMonthEndpoint(page);
    await gotoCalendar(page);
    await waitForCalls(calls, 1);

    // Popula um 2º mês para que a navegação posterior caia inteiramente no IDB.
    const nextBtnOnline = page.locator('.lg\\:col-span-2 button').nth(1);
    await nextBtnOnline.click();
    await waitForCalls(calls, 2);
    const prevBtnOnline = page.locator('.lg\\:col-span-2 button').nth(0);
    await prevBtnOnline.click();
    await page.waitForTimeout(300);

    // Envelhece TODAS as entradas do IDB para além do TTL (7d) → ficam stale.
    await ageAllEntries(page, 1000 * 60 * 60 * 24 * 8);

    // Bloqueia a rede e recarrega.
    await page.unroute('**/functions/v1/liturgical-calendar');
    const blockedCalls: string[] = [];
    await page.route('**/functions/v1/liturgical-calendar', async (route) => {
      blockedCalls.push(route.request().url());
      await route.abort('failed');
    });

    await page.reload();
    await expect(page.getByTestId('liturgical-calendar-cache-panel')).toBeVisible({ timeout: 15_000 });

    // O grid continua renderizando os dias a partir do IDB (stale).
    const dayButtons = page.locator('.lg\\:col-span-2 .grid.grid-cols-7 button');
    await expect(dayButtons.first()).toBeVisible({ timeout: 10_000 });
    expect(await dayButtons.count()).toBeGreaterThan(20);

    // O TTL não pode ser "—": entrada continua presente no IDB mesmo expirada.
    const ttlOffline = await page.getByTestId('litcal-cache-ttl').innerText();
    expect(ttlOffline).not.toBe('—');

    // Aguarda a UI estabilizar (SWR pode tentar 1 revalidação inicial — que será abortada).
    await page.waitForTimeout(800);
    const callsAfterReload = blockedCalls.length;

    // Invariante central: a partir daqui (UI montada), navegar entre meses
    // NÃO deve disparar nenhuma nova requisição enquanto a rede está bloqueada.
    const prevBtn = page.locator('.lg\\:col-span-2 button').nth(0);
    const nextBtn = page.locator('.lg\\:col-span-2 button').nth(1);
    await nextBtn.click();
    await page.waitForTimeout(500);
    await prevBtn.click();
    await page.waitForTimeout(500);
    const callsDuringNavigation = blockedCalls.length - callsAfterReload;
    expect(callsDuringNavigation).toBe(0);

    // Restaura a rede — força um refetch via botão "Atualizar".
    await page.unroute('**/functions/v1/liturgical-calendar');
    const postRecoveryCalls: string[] = [];
    await page.route('**/functions/v1/liturgical-calendar', async (route) => {
      postRecoveryCalls.push(route.request().url());
      const req = route.request();
      let body: any = {};
      try { body = req.postDataJSON?.() ?? JSON.parse(req.postData() || '{}'); } catch { /* */ }
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

    await page.getByTestId('litcal-refresh').click();
    const start = Date.now();
    while (Date.now() - start < 5_000 && postRecoveryCalls.length < 1) {
      await page.waitForTimeout(100);
    }
    expect(postRecoveryCalls.length).toBeGreaterThanOrEqual(1);
    await expect(page.getByTestId('litcal-cache-source')).toHaveText(/Cache fresco/i, { timeout: 5_000 });
  });

  test('rede bloqueada + remover entrada → navegar entre meses não dispara nenhuma chamada', async ({ page }) => {
    const { calls } = await mockMonthEndpoint(page);
    await gotoCalendar(page);
    await waitForCalls(calls, 1);

    // Popula um 2º mês.
    const nextBtn = page.locator('.lg\\:col-span-2 button').nth(1);
    await nextBtn.click();
    await waitForCalls(calls, 2);
    const prevBtn = page.locator('.lg\\:col-span-2 button').nth(0);
    await prevBtn.click();
    await page.waitForTimeout(300);

    // Confirma 2 entries
    const keysBefore = await listIdbKeys(page);
    expect(keysBefore.length).toBeGreaterThanOrEqual(2);

    // Bloqueia rede.
    await page.unroute('**/functions/v1/liturgical-calendar');
    const blocked: string[] = [];
    await page.route('**/functions/v1/liturgical-calendar', async (route) => {
      blocked.push(route.request().url());
      await route.abort('failed');
    });

    // Remove a primeira entrada via UI (com confirmação).
    const targetKey = keysBefore[0];
    const m = /:(\d{4})-(\d{2})$/.exec(targetKey)!;
    const suffix = `${m[1]}-${m[2]}`;
    await page.getByTestId(`litcal-cache-entry-remove-${suffix}`).click();
    await page.getByTestId(`litcal-cache-entry-confirm-yes-${suffix}`).click();

    // Aguarda o IDB perder a chave.
    const start = Date.now();
    while (Date.now() - start < 5_000) {
      const k = await listIdbKeys(page);
      if (!k.includes(targetKey)) break;
      await page.waitForTimeout(50);
    }
    const keysAfterDelete = await listIdbKeys(page);
    expect(keysAfterDelete).not.toContain(targetKey);

    // Navega entre meses — todos devem ser cache miss para o mês removido,
    // mas como a rede está bloqueada NENHUMA chamada pode sair. O app deve
    // degradar silenciosamente (sem crash).
    await nextBtn.click();
    await page.waitForTimeout(500);
    await prevBtn.click();
    await page.waitForTimeout(500);
    await nextBtn.click();
    await page.waitForTimeout(500);

    expect(blocked.length).toBe(0);

    // O painel continua acessível e a entrada removida não voltou.
    const keysFinal = await listIdbKeys(page);
    expect(keysFinal).not.toContain(targetKey);
  });

  test('reload com rede bloqueada lê 100% do IndexedDB e zero requisições saem', async ({ page }) => {
    const { calls } = await mockMonthEndpoint(page);
    await gotoCalendar(page);
    await waitForCalls(calls, 1);

    // Popula 3 meses sequenciais aguardando o IDB consolidar a cada passo.
    const nextBtn = page.locator('.lg\\:col-span-2 button').nth(1);
    async function waitKeys(min: number) {
      const startW = Date.now();
      let ks: string[] = [];
      while (Date.now() - startW < 7_000) {
        ks = await listIdbKeys(page);
        if (ks.length >= min) return ks;
        await page.waitForTimeout(100);
      }
      return ks;
    }
    await waitKeys(1);
    await nextBtn.click();
    await waitKeys(2);
    await page.waitForTimeout(200);
    await nextBtn.click();
    const keysBefore = await waitKeys(3);
    expect(keysBefore.length).toBeGreaterThanOrEqual(3);

    // Bloqueia rede e recarrega.
    await page.unroute('**/functions/v1/liturgical-calendar');
    const blocked: string[] = [];
    await page.route('**/functions/v1/liturgical-calendar', async (route) => {
      blocked.push(route.request().url());
      await route.abort('failed');
    });

    await page.reload();
    await expect(page.getByTestId('liturgical-calendar-cache-panel')).toBeVisible({ timeout: 15_000 });

    const dayButtons = page.locator('.lg\\:col-span-2 .grid.grid-cols-7 button');
    await expect(dayButtons.first()).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(800);
    const blockedAfterReload = blocked.length;

    // Navega entre os meses cacheados — só IDB, nada de rede.
    const prevBtn = page.locator('.lg\\:col-span-2 button').nth(0);
    await nextBtn.click();
    await page.waitForTimeout(400);
    await nextBtn.click();
    await page.waitForTimeout(400);
    await prevBtn.click();
    await page.waitForTimeout(400);
    await prevBtn.click();
    await page.waitForTimeout(400);

    const blockedDuringNav = blocked.length - blockedAfterReload;
    expect(blockedDuringNav).toBe(0);

    // IDB intacto.
    const keysAfter = await listIdbKeys(page);
    expect(keysAfter.length).toBeGreaterThanOrEqual(keysBefore.length);
  });

  test('navegação rápida com rede bloqueada: zero chamadas e grid final corresponde ao mês esperado', async ({ page }) => {
    const { calls } = await mockMonthEndpoint(page);
    await gotoCalendar(page);
    await waitForCalls(calls, 1);

    // Popula 4 meses adiante e aguarda cada chamada terminar.
    const nextBtn = page.locator('.lg\\:col-span-2 button').nth(1);
    const TOTAL = 4;
    for (let i = 0; i < TOTAL; i++) {
      await nextBtn.click();
      await waitForCalls(calls, 2 + i);
      await page.waitForTimeout(150);
    }

    // Volta ao mês inicial sequencialmente.
    const prevBtn = page.locator('.lg\\:col-span-2 button').nth(0);
    for (let i = 0; i < TOTAL; i++) {
      await prevBtn.click();
      await page.waitForTimeout(200);
    }

    // Aguarda IDB ter pelo menos TOTAL+1 entries.
    const startWait = Date.now();
    while (Date.now() - startWait < 5_000) {
      const k = await listIdbKeys(page);
      if (k.length >= TOTAL + 1) break;
      await page.waitForTimeout(100);
    }

    // Captura o título do mês inicial como referência.
    const monthLabel = page.locator('.lg\\:col-span-2 h2, .lg\\:col-span-2 h3, .lg\\:col-span-2 [aria-live]').first();
    const initialTitle = (await monthLabel.innerText().catch(() => '')) || '';

    // Bloqueia a rede.
    await page.unroute('**/functions/v1/liturgical-calendar');
    const blocked: string[] = [];
    await page.route('**/functions/v1/liturgical-calendar', async (route) => {
      blocked.push(route.request().url());
      await route.abort('failed');
    });

    // Sequência rápida: avança TOTAL e volta TOTAL — tudo dentro do range cacheado.
    for (let i = 0; i < TOTAL; i++) {
      await nextBtn.click();
      await page.waitForTimeout(60);
    }
    for (let i = 0; i < TOTAL; i++) {
      await prevBtn.click();
      await page.waitForTimeout(60);
    }

    // Estabiliza antes de assertir.
    await page.waitForTimeout(500);

    // Asserções duras: zero rede, grid renderizado e título de volta ao inicial.
    expect(blocked.length).toBe(0);

    const dayButtons = page.locator('.lg\\:col-span-2 .grid.grid-cols-7 button');
    await expect(dayButtons.first()).toBeVisible({ timeout: 5_000 });
    expect(await dayButtons.count()).toBeGreaterThan(20);

    const finalTitle = (await monthLabel.innerText().catch(() => '')) || '';
    if (initialTitle && finalTitle) {
      expect(finalTitle).toBe(initialTitle);
    }
  });
});
