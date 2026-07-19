/**
 * Nexus — caminhada pela UI real (sem iterar RouteRegistry).
 *
 * Cobre desktop, tablet e mobile grande. Para cada rota de entrada:
 *  1. localiza bubbles reais do Nexus renderizados no DOM;
 *  2. tenta clicar em até N bubbles, com retry curto e auto-skip quando
 *     nada foi indexado no ambiente (registra o motivo em log estruturado);
 *  3. abre o CTA `nexus-open-module`, valida que a URL final
 *     - não cai em 404;
 *     - não usa prefixos legados (`/estudar/*`, `/rezar/*`);
 *     - bate com o `href` que o CTA anunciava (destino ≠ divergente);
 *     - carrega uma heading (`h1`/`h2`) visível compatível com o módulo;
 *  4. em falha, anexa screenshot, trace (`testInfo.outputPath`) e um
 *     dump de requests/responses capturado durante o passo.
 *
 * Complementa:
 *  - `nexus-routes-no-404.spec.ts` (matriz sintética via RouteRegistry)
 *  - `nexus-real-click.spec.ts` (2 passagens fixas)
 */
import { test, expect, type Page, type Request, type Response } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const EVIDENCE_DIR = path.resolve('playwright-report/nexus-evidence');
const FAILURE_LOG = path.join(EVIDENCE_DIR, 'ui-walk-failures.log');
const MISSING_LOG = path.join(EVIDENCE_DIR, 'ui-walk-missing.log');
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile-lg', width: 414, height: 896 },
] as const;

const ENTRY_POINTS = [
  { label: 'bible-jo-6', url: '/bible?book=Jo&chapter=6', expectedModule: /^\/(bible|catechism|saints|magisterium|biblioteca)/ },
  { label: 'bible-mt-5', url: '/bible?book=Mt&chapter=5', expectedModule: /^\/(bible|catechism|saints|magisterium|biblioteca)/ },
  { label: 'catechism-1', url: '/catechism?p=1', expectedModule: /^\/(bible|catechism|saints|magisterium|biblioteca)/ },
  { label: 'catechism-27', url: '/catechism?p=27', expectedModule: /^\/(bible|catechism|saints|magisterium|biblioteca)/ },
];

const MAX_BUBBLES_PER_PAGE = 6;
const BUBBLE_RETRY = 2;

function appendLog(file: string, entry: Record<string, unknown>) {
  fs.appendFileSync(file, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n', 'utf8');
}

type NetEntry = { method: string; url: string; status?: number; type: 'request' | 'response' };
function installNetworkRecorder(page: Page): NetEntry[] {
  const log: NetEntry[] = [];
  const onReq = (r: Request) => log.push({ type: 'request', method: r.method(), url: r.url() });
  const onRes = (r: Response) => log.push({ type: 'response', method: r.request().method(), url: r.url(), status: r.status() });
  page.on('request', onReq);
  page.on('response', onRes);
  return log;
}

async function waitForBubbles(page: Page, timeout: number): Promise<boolean> {
  const first = page.locator('[data-testid^="nexus-bubbles-"]').first();
  for (let attempt = 0; attempt < BUBBLE_RETRY; attempt++) {
    const ok = await first
      .waitFor({ state: 'visible', timeout })
      .then(() => true)
      .catch(() => false);
    if (ok) return true;
    // scroll um pouco para forçar lazy-render antes do retry
    await page.mouse.wheel(0, 400).catch(() => {});
  }
  return false;
}

for (const vp of VIEWPORTS) {
  test.describe(`Nexus UI walk @${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const entry of ENTRY_POINTS) {
      test(`${entry.label} — clicar bubbles reais sem 404`, async ({ page }, testInfo) => {
        const netLog = installNetworkRecorder(page);
        await page.goto(entry.url, { waitUntil: 'domcontentloaded' });

        const found = await waitForBubbles(page, 6000);
        if (!found) {
          appendLog(MISSING_LOG, {
            viewport: vp.name,
            entry: entry.label,
            url: entry.url,
            reason: 'no-bubbles-indexed',
          });
          test.skip(true, `sem bubbles indexados em ${entry.url} @${vp.name}`);
          return;
        }

        const containers = page.locator('[data-testid^="nexus-bubbles-"]');
        const total = Math.min(await containers.count(), MAX_BUBBLES_PER_PAGE);
        let clicked = 0;

        for (let i = 0; i < total; i++) {
          const container = containers.nth(i);
          const bubble = container.locator('button').first();
          if (!(await bubble.isVisible().catch(() => false))) {
            appendLog(MISSING_LOG, { viewport: vp.name, entry: entry.label, bubbleIndex: i, reason: 'bubble-not-visible' });
            continue;
          }

          await bubble.scrollIntoViewIfNeeded().catch(() => {});
          const bubbleLabel = (await bubble.textContent().catch(() => ''))?.trim() ?? '';

          try {
            await bubble.click({ timeout: 3000 });
          } catch {
            appendLog(MISSING_LOG, { viewport: vp.name, entry: entry.label, bubbleIndex: i, reason: 'bubble-click-failed' });
            continue;
          }

          const cta = page.locator('[data-testid="nexus-open-module"]').first();
          const ctaVisible = await cta
            .waitFor({ state: 'visible', timeout: 3000 })
            .then(() => true)
            .catch(() => false);
          if (!ctaVisible) {
            appendLog(MISSING_LOG, { viewport: vp.name, entry: entry.label, bubbleIndex: i, bubbleLabel, reason: 'cta-not-rendered' });
            await page.keyboard.press('Escape').catch(() => {});
            continue;
          }

          const advertisedHref = (await cta.getAttribute('href')) || '';
          const advertisedPath = advertisedHref ? new URL(advertisedHref, page.url()).pathname : '';
          const beforeUrl = page.url();
          const stepNetStart = netLog.length;

          try {
            await Promise.all([page.waitForLoadState('domcontentloaded'), cta.click()]);

            const notFound = page.locator('h1', { hasText: /^404$/ });
            await expect(notFound, `caiu em 404 (bubble "${bubbleLabel}")`).toHaveCount(0);

            const finalPath = new URL(page.url()).pathname;
            expect(finalPath.startsWith('/estudar/'), `prefixo legado /estudar/ (${finalPath})`).toBe(false);
            expect(finalPath.startsWith('/rezar/'), `prefixo legado /rezar/ (${finalPath})`).toBe(false);
            expect(finalPath, `URL final fora dos módulos esperados`).toMatch(entry.expectedModule);

            if (advertisedPath) {
              expect(
                finalPath.startsWith(advertisedPath.split('?')[0]),
                `destino divergente: CTA anunciou ${advertisedPath}, chegou ${finalPath}`,
              ).toBe(true);
            }

            // Heading da página destino deve existir e não estar vazia.
            const heading = page.locator('h1, h2').first();
            await expect(heading, 'página destino sem heading visível').toBeVisible({ timeout: 5000 });
            const headingText = (await heading.textContent())?.trim() ?? '';
            expect(headingText.length, 'heading da página destino está vazia').toBeGreaterThan(0);

            clicked++;
            await page.goto(entry.url, { waitUntil: 'domcontentloaded' });
            await waitForBubbles(page, 6000);
          } catch (err) {
            const slug = `ui-walk__${vp.name}__${entry.label}__bubble-${i}`;
            const shot = path.join(EVIDENCE_DIR, `${slug}.png`);
            const netDump = path.join(EVIDENCE_DIR, `${slug}.network.json`);
            await page.screenshot({ path: shot, fullPage: false }).catch(() => {});
            fs.writeFileSync(netDump, JSON.stringify(netLog.slice(stepNetStart), null, 2));

            await testInfo.attach(`${slug}.png`, { path: shot, contentType: 'image/png' }).catch(() => {});
            await testInfo.attach(`${slug}.network.json`, { path: netDump, contentType: 'application/json' }).catch(() => {});

            // O trace bruto é salvo automaticamente pelo Playwright em `retain-on-failure`.
            // Anexamos explicitamente se o arquivo existir para ficar visível no HTML report.
            const tracePath = testInfo.outputPath('trace.zip');
            if (fs.existsSync(tracePath)) {
              await testInfo.attach(`${slug}.trace.zip`, { path: tracePath, contentType: 'application/zip' }).catch(() => {});
            }

            appendLog(FAILURE_LOG, {
              viewport: vp.name,
              entry: entry.label,
              bubbleIndex: i,
              bubbleLabel,
              advertisedPath,
              from: beforeUrl,
              to: page.url(),
              error: err instanceof Error ? err.message : String(err),
              networkSample: netLog.slice(stepNetStart).slice(-20),
            });
            throw err;
          }
        }

        if (clicked === 0) {
          appendLog(MISSING_LOG, { viewport: vp.name, entry: entry.label, reason: 'no-clickable-bubbles', total });
          test.skip(true, `nenhum bubble clicável em ${entry.url} @${vp.name}`);
        }
      });
    }
  });
}
