/**
 * Regressão SEO: abre um conjunto de rotas públicas indexáveis e valida
 * canonical, title e meta description no <head> — coerentes com ROUTE_META.
 *
 * Executa contra o dev server em http://localhost:8080 (padrão do playwright.config).
 */
import { test, expect } from '@playwright/test';
import { ROUTE_META } from '../../src/config/routeMeta';

const BASE_URL = 'https://www.cathedradigital.com.br';

const PUBLIC_ROUTES = Object.entries(ROUTE_META)
  .filter(([p, meta]) => !meta.noindex && !p.includes(':'))
  .map(([p, meta]) => ({ path: p, meta }));

test.describe('SEO — canonical/title/description por rota', () => {
  for (const { path, meta } of PUBLIC_ROUTES) {
    test(`meta OK em ${path}`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: 'networkidle' });
      expect(res?.status(), `${path} deveria carregar 2xx`).toBeLessThan(400);

      // title
      await expect
        .poll(async () => await page.title(), { timeout: 5_000, message: `title em ${path}` })
        .toContain(meta.title.split(' — ')[0].slice(0, 20));

      // meta description (aceita override por Helmet específico da página)
      const desc = await page.locator('head meta[name="description"]').getAttribute('content');
      expect(desc, `description ausente em ${path}`).toBeTruthy();
      expect(desc!.length, `description em ${path} fora do limite 50..160`).toBeGreaterThanOrEqual(30);
      expect(desc!.length).toBeLessThanOrEqual(180);

      // canonical
      const canonical = await page.locator('head link[rel="canonical"]').first().getAttribute('href');
      expect(canonical, `canonical ausente em ${path}`).toBeTruthy();
      const expectedPath = meta.canonicalPath ?? path;
      expect(canonical!.endsWith(expectedPath) || canonical === `${BASE_URL}${expectedPath}`).toBeTruthy();

      // robots noindex — pública NÃO pode ter noindex
      const robots = await page.locator('head meta[name="robots"]').first().getAttribute('content');
      if (robots) expect(robots.toLowerCase()).not.toContain('noindex');
    });
  }
});
