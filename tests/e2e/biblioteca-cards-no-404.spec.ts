/**
 * Biblioteca — cards principais navegam sem 404.
 *
 * Abre `/biblioteca`, clica em cada card da seção "Coleções"
 * (Sagrada Escritura, Catecismo, Magistério, Santos & Padres) e valida:
 *  - não cai em 404;
 *  - não usa prefixos legados `/estudar/*` ou `/rezar/*`;
 *  - a página destino renderiza uma heading visível não vazia;
 *  - o pathname bate com o `href` anunciado pelo card.
 *
 * Roda em desktop, tablet e mobile grande. Evidências em falha:
 * screenshot + network dump + trace anexados via testInfo.
 */
import { test, expect, type Page, type Request, type Response } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const EVIDENCE_DIR = path.resolve('playwright-report/biblioteca-evidence');
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile-lg', width: 414, height: 896 },
] as const;

const CARDS = [
  { title: /Sagrada Escritura/i, expected: /^\/bible/ },
  { title: /^Catecismo$/i, expected: /^\/catechism/ },
  { title: /Magistério/i, expected: /^\/magisterium/ },
  { title: /Santos\s*&\s*Padres/i, expected: /^\/saints/ },
];

type NetEntry = { method: string; url: string; status?: number; type: 'request' | 'response' };
function installNetworkRecorder(page: Page): NetEntry[] {
  const log: NetEntry[] = [];
  page.on('request', (r: Request) => log.push({ type: 'request', method: r.method(), url: r.url() }));
  page.on('response', (r: Response) => log.push({ type: 'response', method: r.request().method(), url: r.url(), status: r.status() }));
  return log;
}

for (const vp of VIEWPORTS) {
  test.describe(`Biblioteca cards @${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const card of CARDS) {
      test(`card "${card.title}" navega sem 404`, async ({ page }, testInfo) => {
        const netLog = installNetworkRecorder(page);
        await page.goto('/biblioteca', { waitUntil: 'domcontentloaded' });

        const link = page.getByRole('link', { name: card.title }).first();
        await expect(link, `card "${card.title}" não encontrado`).toBeVisible({ timeout: 8000 });

        const href = (await link.getAttribute('href')) || '';
        const advertised = href ? new URL(href, page.url()).pathname : '';

        const stepNetStart = netLog.length;
        try {
          await link.scrollIntoViewIfNeeded().catch(() => {});
          await Promise.all([page.waitForLoadState('domcontentloaded'), link.click()]);

          const notFound = page.locator('h1', { hasText: /^404$/ });
          await expect(notFound, `card "${card.title}" caiu em 404`).toHaveCount(0);

          const finalPath = new URL(page.url()).pathname;
          expect(finalPath.startsWith('/estudar/'), `prefixo legado /estudar/ (${finalPath})`).toBe(false);
          expect(finalPath.startsWith('/rezar/'), `prefixo legado /rezar/ (${finalPath})`).toBe(false);
          expect(finalPath, `URL final fora do módulo esperado`).toMatch(card.expected);

          if (advertised) {
            expect(
              finalPath.startsWith(advertised.split('?')[0]),
              `destino divergente: card anunciou ${advertised}, chegou ${finalPath}`,
            ).toBe(true);
          }

          const heading = page.locator('h1, h2').first();
          await expect(heading, 'página destino sem heading visível').toBeVisible({ timeout: 5000 });
          const headingText = (await heading.textContent())?.trim() ?? '';
          expect(headingText.length, 'heading da página destino está vazia').toBeGreaterThan(0);
        } catch (err) {
          const slug = `biblioteca__${vp.name}__${String(card.title).replace(/[^a-z0-9]+/gi, '-')}`;
          const shot = path.join(EVIDENCE_DIR, `${slug}.png`);
          const netDump = path.join(EVIDENCE_DIR, `${slug}.network.json`);
          await page.screenshot({ path: shot }).catch(() => {});
          fs.writeFileSync(netDump, JSON.stringify(netLog.slice(stepNetStart), null, 2));

          await testInfo.attach(`${slug}.png`, { path: shot, contentType: 'image/png' }).catch(() => {});
          await testInfo.attach(`${slug}.network.json`, { path: netDump, contentType: 'application/json' }).catch(() => {});
          const tracePath = testInfo.outputPath('trace.zip');
          if (fs.existsSync(tracePath)) {
            await testInfo.attach(`${slug}.trace.zip`, { path: tracePath, contentType: 'application/zip' }).catch(() => {});
          }
          throw err;
        }
      });
    }
  });
}
