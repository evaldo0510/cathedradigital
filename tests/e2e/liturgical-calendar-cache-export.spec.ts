import { test, expect, type Page, type Route } from '@playwright/test';

/**
 * Valida que o botão "Exportar JSON" do painel de cache do calendário
 * gera um arquivo JSON estruturado contendo:
 *  - meses (key, year, month, cachedAt, ttlMs)
 *  - estatísticas por chave (hits/misses/staleHits)
 *  - totals globais (hit/miss)
 */

const CAL_ROUTE = '/calendar?litcal_no_prefetch=1';

async function mockMonthEndpoint(page: Page) {
  const calls: Array<{ year: number; month: number }> = [];
  await page.route('**/functions/v1/liturgical-calendar', async (route: Route) => {
    const req = route.request();
    let body: any = {};
    try { body = req.postDataJSON?.() ?? JSON.parse(req.postData() || '{}'); } catch { /* */ }
    calls.push({ year: Number(body.year), month: Number(body.month) });
    if (body.action !== 'month') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    const y = Number(body.year);
    const m = Number(body.month);
    const days = Array.from({ length: new Date(y, m, 0).getDate() }, (_, i) => ({
      date: `${y}-${String(m).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
      season: 'ordinary',
      celebrations: [{ title: `Test ${y}-${m}-${i + 1}`, colour: 'green', rank: 'ferial' }],
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

test.describe('Cache do calendário · exportar JSON', () => {
  test('o arquivo baixado contém meses, hit/miss e TTL corretos', async ({ page }) => {
    const { calls } = await mockMonthEndpoint(page);

    await page.goto('/');
    await page.evaluate(() => window.localStorage.removeItem('cathedra_litcal_stats'));
    await page.goto(CAL_ROUTE);
    await expect(page.getByTestId('liturgical-calendar-cache-panel')).toBeVisible({ timeout: 15_000 });

    // Garante 1ª chamada
    await waitFor(() => calls.length >= 1);
    const firstCalls = calls.length;

    // Avança um mês para ter ao menos 2 entradas no IndexedDB
    const nextBtn = page.locator('.lg\\:col-span-2 button').nth(2);
    await nextBtn.click();
    await waitFor(() => calls.length >= firstCalls + 1);

    // Volta — gera um hit registrado por chave
    const prevBtn = page.locator('.lg\\:col-span-2 button').first();
    await prevBtn.click();

    // Aguarda 2 linhas em "Meses em cache"
    await waitFor(async () => {
      const count = await page.locator('[data-testid^="litcal-cache-entry-"][data-testid$="-01"], [data-testid^="litcal-cache-entry-"]').count();
      return count >= 2;
    });

    // Dispara o download e captura o conteúdo
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('litcal-cache-export').click(),
    ]);
    const stream = await download.createReadStream();
    const buf: Buffer[] = [];
    for await (const chunk of stream as any) buf.push(chunk as Buffer);
    const json = JSON.parse(Buffer.concat(buf).toString('utf8'));

    // ── Estrutura geral ──
    expect(json.kind).toBe('cathedra-liturgical-calendar-cache');
    expect(typeof json.exportedAt).toBe('string');
    expect(Number.isFinite(json.version)).toBe(true);

    // ── Totais (hits/misses) ──
    expect(json.totals).toBeDefined();
    expect(typeof json.totals.hits).toBe('number');
    expect(typeof json.totals.misses).toBe('number');
    expect(typeof json.totals.staleHits).toBe('number');
    // Devem ser não-negativos
    expect(json.totals.hits).toBeGreaterThanOrEqual(0);
    expect(json.totals.misses).toBeGreaterThanOrEqual(1);

    // ── perKey ──
    expect(json.perKey && typeof json.perKey === 'object').toBe(true);

    // ── entries ──
    expect(Array.isArray(json.entries)).toBe(true);
    expect(json.entries.length).toBeGreaterThanOrEqual(2);

    for (const e of json.entries) {
      expect(typeof e.key).toBe('string');
      expect(e.key).toMatch(/^.+:.+:\d{4}-\d{2}$/);
      expect(Number.isInteger(e.year)).toBe(true);
      expect(e.month).toBeGreaterThanOrEqual(1);
      expect(e.month).toBeLessThanOrEqual(12);
      expect(Number.isFinite(e.cachedAt)).toBe(true);
      expect(e.cachedAt).toBeGreaterThan(0);
      expect(Number.isFinite(e.ttlMs)).toBe(true);
      expect(e.ttlMs).toBeGreaterThan(0);
      expect(Number.isFinite(e.remainingMs)).toBe(true);
      // recém cacheado → ainda não expirado
      expect(e.isStale).toBe(false);
      expect(e.remainingMs).toBeGreaterThan(0);

      expect(e.stats).toBeDefined();
      expect(typeof e.stats.hits).toBe('number');
      expect(typeof e.stats.misses).toBe('number');
      expect(typeof e.stats.staleHits).toBe('number');
    }

    // ── Storage estimate ──
    expect(typeof json.storage.bytes).toBe('number');
    expect(json.storage.bytes).toBeGreaterThan(0);
    expect(json.storage.entries).toBe(json.entries.length);
  });
});
