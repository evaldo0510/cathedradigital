/**
 * Nexus — caminhada pela UI real (sem iterar RouteRegistry).
 *
 * Objetivo: abrir páginas reais do app, localizar todos os bubbles do Nexus
 * renderizados na tela, clicar em cada um e no CTA `nexus-open-module`,
 * validando que nenhuma navegação cai em 404 nem em prefixos legados
 * (`/estudar/*`, `/rezar/*`). Roda em desktop, tablet e mobile grande.
 *
 * Complementa:
 *  - `nexus-routes-no-404.spec.ts` (matriz sintética via RouteRegistry)
 *  - `nexus-real-click.spec.ts` (2 passagens fixas)
 *
 * Evidências: screenshots + log estruturado em
 * `playwright-report/nexus-evidence/ui-walk-failures.log`.
 */
import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const EVIDENCE_DIR = path.resolve('playwright-report/nexus-evidence');
const FAILURE_LOG = path.join(EVIDENCE_DIR, 'ui-walk-failures.log');
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile-lg', width: 414, height: 896 },
] as const;

// Rotas reais com alta densidade de bubbles do Nexus.
const ENTRY_POINTS = [
  { label: 'bible-jo-6', url: '/bible?book=Jo&chapter=6' },
  { label: 'bible-mt-5', url: '/bible?book=Mt&chapter=5' },
  { label: 'catechism-1', url: '/catechism?p=1' },
  { label: 'catechism-27', url: '/catechism?p=27' },
];

const MAX_BUBBLES_PER_PAGE = 6; // limita para manter o run rápido

function logFailure(entry: Record<string, unknown>) {
  fs.appendFileSync(FAILURE_LOG, JSON.stringify(entry) + '\n', 'utf8');
}

async function assertNoLegacyOr404(page: Page, context: Record<string, unknown>) {
  const notFound = page.locator('h1', { hasText: /^404$/ });
  await expect(notFound, `caiu em 404 (${JSON.stringify(context)})`).toHaveCount(0);
  const finalPath = new URL(page.url()).pathname;
  expect(finalPath.startsWith('/estudar/'), `prefixo legado /estudar/ (${finalPath})`).toBe(false);
  expect(finalPath.startsWith('/rezar/'), `prefixo legado /rezar/ (${finalPath})`).toBe(false);
  return finalPath;
}

for (const vp of VIEWPORTS) {
  test.describe(`Nexus UI walk @${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const entry of ENTRY_POINTS) {
      test(`${entry.label} — clicar bubbles reais sem 404`, async ({ page }, testInfo) => {
        await page.goto(entry.url, { waitUntil: 'domcontentloaded' });

        // Coleta containers de bubbles visíveis.
        const containers = page.locator('[data-testid^="nexus-bubbles-"]');
        const firstAppeared = await containers
          .first()
          .waitFor({ state: 'visible', timeout: 8000 })
          .then(() => true)
          .catch(() => false);

        if (!firstAppeared) {
          test.skip(true, `sem bubbles indexados em ${entry.url} @${vp.name}`);
          return;
        }

        const total = Math.min(await containers.count(), MAX_BUBBLES_PER_PAGE);
        let clicked = 0;

        for (let i = 0; i < total; i++) {
          const container = containers.nth(i);
          const bubble = container.locator('button').first();
          if (!(await bubble.isVisible().catch(() => false))) continue;

          await bubble.scrollIntoViewIfNeeded().catch(() => {});
          try {
            await bubble.click({ timeout: 3000 });
          } catch {
            continue;
          }

          const cta = page.locator('[data-testid="nexus-open-module"]').first();
          const ctaVisible = await cta
            .waitFor({ state: 'visible', timeout: 3000 })
            .then(() => true)
            .catch(() => false);
          if (!ctaVisible) {
            // fecha popover clicando fora e segue
            await page.keyboard.press('Escape').catch(() => {});
            continue;
          }

          const beforeUrl = page.url();
          try {
            await Promise.all([
              page.waitForLoadState('domcontentloaded'),
              cta.click(),
            ]);
            const finalPath = await assertNoLegacyOr404(page, {
              entry: entry.label,
              viewport: vp.name,
              bubbleIndex: i,
              from: beforeUrl,
            });
            clicked++;
            // volta para a página de entrada para clicar o próximo bubble
            await page.goto(entry.url, { waitUntil: 'domcontentloaded' });
            await containers.first().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
            void finalPath;
          } catch (err) {
            const shot = path.join(
              EVIDENCE_DIR,
              `ui-walk__${vp.name}__${entry.label}__bubble-${i}.png`,
            );
            await page.screenshot({ path: shot }).catch(() => {});
            await testInfo.attach(`ui-walk-${vp.name}-${entry.label}-${i}.png`, {
              path: shot,
              contentType: 'image/png',
            }).catch(() => {});
            logFailure({
              ts: new Date().toISOString(),
              viewport: vp.name,
              entry: entry.label,
              bubbleIndex: i,
              url: page.url(),
              error: err instanceof Error ? err.message : String(err),
            });
            throw err;
          }
        }

        expect(clicked, `nenhum bubble clicável em ${entry.url} @${vp.name}`).toBeGreaterThan(0);
      });
    }
  });
}
