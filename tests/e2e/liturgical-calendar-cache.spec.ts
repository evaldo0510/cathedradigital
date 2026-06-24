import { test, expect, type Page, type Route } from '@playwright/test';

/**
 * Suite de integração do cache do calendário litúrgico.
 *
 * Cenários:
 *  1. Navegar entre meses já visitados não dispara novas chamadas à edge function.
 *  2. Modo offline (rede indisponível) continua exibindo dados do IndexedDB.
 *  3. Quando o TTL do IndexedDB expira, a UI refaz a busca no backend.
 *
 * O painel "Cache do Calendário" é usado como observatório (hits/misses/TTL).
 */

const CAL_ROUTE = '/calendar?litcal_no_prefetch=1';

// Helper: mock estável da edge function `liturgical-calendar` (action="month").
// Conta as chamadas e devolve um payload mínimo válido.
async function mockMonthEndpoint(page: Page) {
  const calls: Array<{ year: number; month: number; at: number }> = [];

  const handler = async (route: Route) => {
    const req = route.request();
    let body: any = {};
    try { body = req.postDataJSON?.() ?? JSON.parse(req.postData() || '{}'); } catch { /* */ }
    calls.push({ year: body.year, month: body.month, at: Date.now() });

    if (body.action !== 'month') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }

    const y = Number(body.year);
    const m = Number(body.month);
    const daysInMonth = new Date(y, m, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      return {
        date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        season: 'ordinary',
        celebrations: [{ title: `Test ${y}-${m}-${d}`, colour: 'green', rank: 'ferial' }],
      };
    });

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(days),
    });
  };

  await page.route('**/functions/v1/liturgical-calendar', handler);
  return { calls };
}

async function gotoCalendar(page: Page) {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.removeItem('cathedra_litcal_stats'));
  await page.goto(CAL_ROUTE);
  await expect(page.getByTestId('liturgical-calendar-cache-panel')).toBeVisible({ timeout: 15_000 });
}

// Espera n chamadas com timeout
async function waitForCalls(calls: { length: number }, expected: number, timeoutMs = 10_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (calls.length >= expected) return;
    await new Promise((r) => setTimeout(r, 50));
  }
}

test.describe('Calendário litúrgico · cache em camadas', () => {
  test('navegação entre meses reutiliza o cache (sem novas chamadas)', async ({ page }) => {
    const { calls } = await mockMonthEndpoint(page);
    await gotoCalendar(page);

    // 1ª carga: 1 chamada para o mês atual
    await waitForCalls(calls, 1);
    const initialCalls = calls.length;
    expect(initialCalls).toBe(1);

    // Avança para o próximo mês — deve disparar exatamente +1 chamada
    await page.locator('button[aria-label="Atualizar calendário"]').waitFor();
    const nextBtn = page.locator('.lg\\:col-span-2 button').nth(2); // botão de avançar mês
    await nextBtn.click();
    await waitForCalls(calls, initialCalls + 1);
    expect(calls.length).toBe(initialCalls + 1);

    // Volta — mês anterior já está em RQ + IDB, NÃO deve chamar a edge function
    const prevBtn = page.locator('.lg\\:col-span-2 button').first();
    await prevBtn.click();
    await page.waitForTimeout(800);
    expect(calls.length).toBe(initialCalls + 1);

    // Painel deve indicar cache fresco e ao menos 1 hit
    await expect(page.getByTestId('litcal-cache-source')).toHaveText(/Cache fresco/i);
    const hits = Number(await page.getByTestId('litcal-cache-hits').innerText());
    expect(hits).toBeGreaterThanOrEqual(1);
  });

  test('modo offline (rede indisponível) continua servindo do IndexedDB', async ({ page, context }) => {
    const { calls } = await mockMonthEndpoint(page);
    await gotoCalendar(page);
    await waitForCalls(calls, 1);
    const seededTtl = await page.getByTestId('litcal-cache-ttl').innerText();
    expect(seededTtl).not.toMatch(/—/);

    // Recarrega com a edge function totalmente indisponível
    await page.unroute('**/functions/v1/liturgical-calendar');
    await page.route('**/functions/v1/liturgical-calendar', (route) => route.abort('failed'));

    await page.reload();
    await expect(page.getByTestId('liturgical-calendar-cache-panel')).toBeVisible({ timeout: 15_000 });

    // O grid do mês deve continuar renderizando dias normalmente
    const dayButtons = page.locator('.lg\\:col-span-2 .grid.grid-cols-7 button');
    await expect(dayButtons.first()).toBeVisible({ timeout: 10_000 });
    expect(await dayButtons.count()).toBeGreaterThan(20);

    // Painel ainda reporta cacheAt válido (não voltou a "—")
    await expect(page.getByTestId('litcal-cache-ttl')).not.toHaveText('—');
  });

  test('expiração de TTL no IndexedDB força refetch no backend', async ({ page }) => {
    const { calls } = await mockMonthEndpoint(page);
    await gotoCalendar(page);
    await waitForCalls(calls, 1);
    const baseline = calls.length;

    // Reload imediato — deve servir do cache fresh (zero novas chamadas)
    await page.reload();
    await expect(page.getByTestId('liturgical-calendar-cache-panel')).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(500);
    expect(calls.length).toBe(baseline);

    // Envelhece o entry do IndexedDB em ~8 dias (TTL = 7d)
    await page.evaluate(async () => {
      const EIGHT_DAYS = 1000 * 60 * 60 * 24 * 8;
      const req = indexedDB.open('cathedra_cache');
      await new Promise<void>((resolve, reject) => {
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction('liturgical-calendar', 'readwrite');
          const store = tx.objectStore('liturgical-calendar');
          const getAll = store.getAll();
          getAll.onsuccess = () => {
            for (const entry of getAll.result as Array<{ key: string; cachedAt: number; data: unknown; v?: number }>) {
              store.put({ ...entry, cachedAt: Date.now() - EIGHT_DAYS });
            }
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
          };
          getAll.onerror = () => reject(getAll.error);
        };
        req.onerror = () => reject(req.error);
      });
    });

    // Novo reload → IDB está stale → deve refazer a busca no backend
    await page.reload();
    await expect(page.getByTestId('liturgical-calendar-cache-panel')).toBeVisible({ timeout: 15_000 });
    await waitForCalls(calls, baseline + 1);
    expect(calls.length).toBe(baseline + 1);

    // Painel deve voltar a marcar como cache fresco após o refetch
    await expect(page.getByTestId('litcal-cache-source')).toHaveText(/Cache fresco/i, { timeout: 5_000 });
  });

  test('botão "Atualizar calendário" força refetch e sincroniza IDB + React Query', async ({ page }) => {
    const { calls } = await mockMonthEndpoint(page);
    await gotoCalendar(page);
    await waitForCalls(calls, 1);
    const baseline = calls.length;

    await page.getByTestId('litcal-refresh').click();
    await waitForCalls(calls, baseline + 1);
    expect(calls.length).toBe(baseline + 1);

    // Após refresh o cachedAt foi atualizado (TTL próximo de 7d)
    const ttl = await page.getByTestId('litcal-cache-ttl').innerText();
    expect(ttl).toMatch(/\d+\s*(d|h|min)/);
  });
});
