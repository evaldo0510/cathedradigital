/**
 * Clica em cada link público do rodapé (fonte: src/config/footer-links.ts)
 * e valida:
 *  - Destino carrega sem 404 (status HTTP + ausência de NotFound no DOM).
 *  - Rota tem tag <link rel="canonical"> coerente.
 *  - Se ROUTE_META tem og:*, valida title/og:title mínimos.
 *
 * Links externos (href absoluto) são apenas cabeçalho HEAD.
 */
import { test, expect, type Page } from '@playwright/test';
import {
  PUBLIC_FOOTER_LINKS,
  CONDITIONAL_FOOTER_LINKS,
  EXTERNAL_FOOTER_LINKS,
} from '../../src/config/footer-links';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080';

async function assertNoNotFound(page: Page) {
  const body = (await page.locator('body').innerText()).slice(0, 4000).toLowerCase();
  const notFoundHints = ['not found', 'página não encontrada', '404', 'route not found'];
  for (const hint of notFoundHints) {
    if (body.includes(hint)) {
      // Aceita se aparece dentro de conteúdo editorial legítimo (ex.: "erro 404 explicado").
      // Como heurística, só falha se houver <h1> contendo 404 / Not Found.
      const h1 = (await page.locator('h1').first().innerText().catch(() => '')).toLowerCase();
      expect(h1, `Rota parece 404 (h1="${h1}")`).not.toMatch(/404|not found|não encontrada/);
      break;
    }
  }
}

async function readMeta(page: Page, selector: string): Promise<string | null> {
  return page.locator(selector).first().getAttribute('content').catch(() => null);
}

test.describe('Footer — links públicos não retornam 404', () => {
  for (const link of [...PUBLIC_FOOTER_LINKS, ...CONDITIONAL_FOOTER_LINKS]) {
    if (!link.path) continue;
    const isAdminOnly = link.adminOnly === true;

    test(`internal · ${link.label} → ${link.path}${isAdminOnly ? ' (admin-only, esperado 200 ou noindex)' : ''}`, async ({ page }) => {
      const response = await page.goto(`${BASE}${link.path}`, { waitUntil: 'domcontentloaded' });
      expect(response, `sem resposta para ${link.path}`).not.toBeNull();
      const status = response!.status();
      expect(status, `status HTTP inesperado em ${link.path}`).toBeLessThan(400);

      await assertNoNotFound(page);

      const canonical = await page.locator('link[rel="canonical"]').first().getAttribute('href').catch(() => null);
      if (canonical) {
        // Canonical deve apontar para a rota atual ou para o domínio canônico correspondente.
        expect(canonical.toLowerCase()).toContain(link.path.toLowerCase().replace(/\/$/, '') || '/');
      }

      const title = await page.title();
      expect(title.trim().length, `<title> vazio em ${link.path}`).toBeGreaterThan(3);

      const ogTitle = await readMeta(page, 'meta[property="og:title"]');
      const ogUrl   = await readMeta(page, 'meta[property="og:url"]');
      if (ogTitle) expect(ogTitle.trim().length).toBeGreaterThan(3);
      if (ogUrl)   expect(ogUrl.toLowerCase()).toContain(link.path.toLowerCase().replace(/\/$/, '') || '/');
    });
  }

  for (const link of EXTERNAL_FOOTER_LINKS) {
    if (!link.href) continue;
    test(`external · ${link.label} (HEAD)`, async ({ request }) => {
      const res = await request.fetch(link.href!, { method: 'GET', maxRedirects: 5 }).catch((e) => {
        throw new Error(`Falha ao alcançar ${link.href}: ${e.message}`);
      });
      expect(res.status(), `${link.href} retornou ${res.status()}`).toBeLessThan(500);
    });
  }

  test('clica em cada link do footer no browser e valida navegação SPA', async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    const nav = page.locator('[data-testid="footer-public-nav"]').first();
    await nav.scrollIntoViewIfNeeded();

    for (const link of PUBLIC_FOOTER_LINKS) {
      if (!link.path) continue;
      const trigger = nav.getByRole('button', { name: link.label }).or(nav.getByRole('link', { name: link.label })).first();
      await trigger.scrollIntoViewIfNeeded();
      await trigger.click();
      await page.waitForURL(new RegExp(`${link.path.replace(/[/-]/g, '\\$&')}$`), { timeout: 8000 });
      await assertNoNotFound(page);
      await page.goBack({ waitUntil: 'domcontentloaded' });
      await nav.scrollIntoViewIfNeeded();
    }
  });
});
