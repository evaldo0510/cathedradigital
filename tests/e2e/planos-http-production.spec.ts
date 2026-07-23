import { test, expect, request as pwRequest } from '@playwright/test';

/**
 * Testes HTTP contra o DOMÍNIO DE PRODUÇÃO (Vercel).
 * Só roda quando PROD_BASE_URL está definido — evita rodar contra localhost.
 *
 * Valida:
 * - /planos e variações → 301/308 com Location apontando para /pricing (sem loop, ≤ 4 saltos)
 * - Query string preservada quando aplicável
 * - /pricing → 200, X-Robots-Tag sem noindex, Link rel="canonical" apontando para /pricing
 */
const PROD = process.env.PROD_BASE_URL;

test.describe('HTTP produção · /planos redirect + /pricing headers', () => {
  test.skip(!PROD, 'defina PROD_BASE_URL (ex.: https://www.cathedradigital.com.br) para rodar');

  const ALIASES = [
    { path: '/planos', preserveQuery: false },
    { path: '/planos/', preserveQuery: false },
    { path: '/planos?utm_source=nl&utm_medium=email', preserveQuery: true },
    { path: '/planos/foo', preserveQuery: false },
  ];

  for (const { path, preserveQuery } of ALIASES) {
    test(`${path} → 301/308 → /pricing sem loop`, async () => {
      const ctx = await pwRequest.newContext({ baseURL: PROD, maxRedirects: 0 });

      const visited: string[] = [];
      let current = path;
      let hops = 0;
      let lastStatus = 0;

      while (hops < 5) {
        const res = await ctx.fetch(current, { method: 'GET', maxRedirects: 0 });
        lastStatus = res.status();
        visited.push(`${lastStatus} ${current}`);

        if (![301, 302, 307, 308].includes(lastStatus)) break;
        const loc = res.headers()['location'];
        expect(loc, `Location ausente no salto ${hops} para ${current}`).toBeTruthy();
        expect(loc, `redirect não aponta para /pricing (${current} → ${loc})`).toMatch(/\/pricing/);
        expect(loc, 'redirect não pode voltar para /planos').not.toContain('/planos');
        current = new URL(loc!, PROD!).pathname + new URL(loc!, PROD!).search;
        hops += 1;
      }

      expect(hops, `loop de redirect: ${visited.join(' → ')}`).toBeLessThanOrEqual(4);
      expect([301, 308]).toContain(
        parseInt(visited[0].split(' ')[0], 10),
      );

      // Destino final: /pricing, status 200
      expect(lastStatus, `destino final não é 200: ${visited.join(' → ')}`).toBe(200);
      expect(new URL(current, PROD!).pathname).toBe('/pricing');

      // Query string preservada (quando aplicável)
      if (preserveQuery) {
        const originalQuery = new URL(path, PROD!).search;
        const finalQuery = new URL(current, PROD!).search;
        expect(finalQuery, `query string não preservada em ${path}`).toBe(originalQuery);
      }

      await ctx.dispose();
    });
  }

  test('/pricing responde 200 com headers SEO corretos', async () => {
    const ctx = await pwRequest.newContext({ baseURL: PROD });
    const res = await ctx.get('/pricing');
    expect(res.status()).toBe(200);

    const headers = res.headers();

    const xRobots = headers['x-robots-tag'];
    if (xRobots) {
      expect(xRobots.toLowerCase()).not.toContain('noindex');
      expect(xRobots.toLowerCase()).not.toContain('/planos');
    }

    const link = headers['link'];
    if (link) {
      expect(link).toMatch(/rel=["']?canonical["']?/i);
      expect(link).toContain('/pricing');
      expect(link).not.toContain('/planos');
    }

    await ctx.dispose();
  });

  test('/planos envia X-Robots-Tag noindex (defensivo)', async () => {
    const ctx = await pwRequest.newContext({ baseURL: PROD, maxRedirects: 0 });
    const res = await ctx.get('/planos');
    const xRobots = res.headers()['x-robots-tag'];
    if (xRobots) {
      expect(xRobots.toLowerCase()).toContain('noindex');
    }
    await ctx.dispose();
  });
});
