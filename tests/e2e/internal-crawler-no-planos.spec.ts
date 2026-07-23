import { test, expect } from '@playwright/test';

/**
 * Crawler interno: partindo de /, visita todos os links same-origin
 * (BFS limitado) e falha se qualquer href ou URL final ainda apontar
 * para /planos em vez de /pricing.
 */
const MAX_PAGES = 25;

test.describe('Crawler interno — nenhum /planos remanescente', () => {
  test('todos os links internos apontam para /pricing', async ({ page, baseURL }) => {
    const origin = new URL(baseURL ?? 'http://localhost:8080').origin;
    const visited = new Set<string>();
    const queue: string[] = ['/'];
    const offenders: Array<{ from: string; href: string }> = [];

    while (queue.length && visited.size < MAX_PAGES) {
      const path = queue.shift()!;
      if (visited.has(path)) continue;
      visited.add(path);

      const res = await page.goto(path, { waitUntil: 'domcontentloaded' }).catch(() => null);
      if (!res) continue;

      const finalPath = new URL(page.url()).pathname;
      if (finalPath === '/planos') {
        offenders.push({ from: path, href: '(final URL)' });
      }

      const hrefs = await page.$$eval('a[href]', (as) =>
        as.map((a) => (a as HTMLAnchorElement).getAttribute('href') ?? ''),
      );

      for (const raw of hrefs) {
        if (!raw || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:')) continue;
        let url: URL;
        try {
          url = new URL(raw, origin);
        } catch {
          continue;
        }
        if (url.origin !== origin) continue;

        if (url.pathname === '/planos' || url.pathname.startsWith('/planos/')) {
          offenders.push({ from: path, href: raw });
        }

        if (!visited.has(url.pathname) && !queue.includes(url.pathname)) {
          queue.push(url.pathname);
        }
      }
    }

    expect(
      offenders,
      `Links para /planos encontrados:\n${offenders.map((o) => `  ${o.from} → ${o.href}`).join('\n')}`,
    ).toEqual([]);
  });
});
