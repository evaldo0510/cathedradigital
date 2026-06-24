import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

/**
 * Mede performance de carregamento e renderização do módulo da Bíblia
 * em duas condições: cold cache (contexto novo) e warm cache (segundo load).
 *
 * Saída: /tmp/bible-qa/perf/{cold,warm}.json + diff.json
 */

const OUT_DIR = '/tmp/bible-qa/perf';
mkdirSync(OUT_DIR, { recursive: true });

interface PerfSnapshot {
  label: 'cold' | 'warm';
  ttfbMs: number | null;
  domContentLoadedMs: number | null;
  loadEventEndMs: number | null;
  fcpMs: number | null;
  lcpMs: number | null;
  cls: number | null;
  resources: {
    total: number;
    bibleTextCalls: number;
    transferredBytes: number;
  };
  bookSelectToFirstVerseMs: number | null;
  url: string;
  durationMs: number;
}

async function captureMetrics(page: Page, label: 'cold' | 'warm'): Promise<PerfSnapshot> {
  const start = Date.now();
  await page.goto('/bible', { waitUntil: 'load' });
  await page.waitForTimeout(1500); // estabiliza LCP / CLS

  const metrics = await page.evaluate(async () => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const paints = performance.getEntriesByType('paint');
    const fcp = paints.find((p) => p.name === 'first-contentful-paint')?.startTime ?? null;

    let lcp: number | null = null;
    try {
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint') as PerformanceEntry[];
      if (lcpEntries.length > 0) lcp = lcpEntries[lcpEntries.length - 1].startTime;
    } catch { /* */ }

    let cls = 0;
    try {
      const entries = performance.getEntriesByType('layout-shift') as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>;
      for (const e of entries) if (!e.hadRecentInput) cls += e.value;
    } catch { /* */ }

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const bibleCalls = resources.filter((r) => /functions\/v1\/bible-text/.test(r.name)).length;
    const transferred = resources.reduce((acc, r) => acc + (r.transferSize ?? 0), 0);

    return {
      ttfbMs: nav ? nav.responseStart - nav.requestStart : null,
      domContentLoadedMs: nav ? nav.domContentLoadedEventEnd - nav.startTime : null,
      loadEventEndMs: nav ? nav.loadEventEnd - nav.startTime : null,
      fcpMs: fcp,
      lcpMs: lcp,
      cls,
      resources: { total: resources.length, bibleTextCalls: bibleCalls, transferredBytes: transferred },
    };
  });

  // Tenta clicar em um livro e medir tempo até o primeiro versículo aparecer.
  let bookSelectMs: number | null = null;
  try {
    const firstBook = page.locator('button:has-text("Gênesis"), button:has-text("Genesis")').first();
    if (await firstBook.count() > 0) {
      const t0 = Date.now();
      await firstBook.click({ timeout: 3_000 });
      const firstChapterBtn = page.locator('button:has-text("1")').first();
      if (await firstChapterBtn.count() > 0) await firstChapterBtn.click({ timeout: 3_000 }).catch(() => {});
      const verseLocator = page.locator('[data-testid^="verse-text-"]').first();
      await verseLocator.waitFor({ state: 'visible', timeout: 10_000 });
      bookSelectMs = Date.now() - t0;
    }
  } catch { /* tolerante */ }

  return {
    label,
    ...metrics,
    bookSelectToFirstVerseMs: bookSelectMs,
    url: page.url(),
    durationMs: Date.now() - start,
  };
}

test.describe('Bíblia · performance (cold vs warm)', () => {
  test('coleta métricas e gera relatório JSON', async ({ browser }) => {
    // COLD: contexto novo, sem nada cacheado.
    const coldCtx = await browser.newContext();
    const coldPage = await coldCtx.newPage();
    const cold = await captureMetrics(coldPage, 'cold');
    writeFileSync(`${OUT_DIR}/cold.json`, JSON.stringify(cold, null, 2));

    // WARM: reusa o mesmo contexto, recarrega → cache ativo.
    const warm = await captureMetrics(coldPage, 'warm');
    writeFileSync(`${OUT_DIR}/warm.json`, JSON.stringify(warm, null, 2));
    await coldCtx.close();

    const diff = {
      ttfbDeltaMs: (cold.ttfbMs ?? 0) - (warm.ttfbMs ?? 0),
      lcpDeltaMs: (cold.lcpMs ?? 0) - (warm.lcpMs ?? 0),
      loadDeltaMs: (cold.loadEventEndMs ?? 0) - (warm.loadEventEndMs ?? 0),
      requestsDelta: cold.resources.total - warm.resources.total,
      bibleTextCallsDelta: cold.resources.bibleTextCalls - warm.resources.bibleTextCalls,
      bytesDelta: cold.resources.transferredBytes - warm.resources.transferredBytes,
    };
    writeFileSync(`${OUT_DIR}/diff.json`, JSON.stringify({ cold, warm, diff }, null, 2));

    // Asserções mínimas: o módulo carrega.
    expect(cold.loadEventEndMs).not.toBeNull();
    expect(warm.loadEventEndMs).not.toBeNull();
  });
});
