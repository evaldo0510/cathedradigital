import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

/**
 * Regressão de color-contrast (axe-core) em TODAS as rotas públicas.
 *
 * - ENFORCED_ROUTES: falha o CI em qualquer violação `color-contrast`.
 *   Rotas já saneadas — protegem contra regressão.
 * - TRACKED_ROUTES: rodam a mesma auditoria e persistem o relatório JSON.
 *   NÃO falham enquanto tiverem violações (monitoramento).
 *   FALHAM ao atingirem 0 nós — forçam a promoção para ENFORCED_ROUTES
 *   no mesmo PR que sanou a rota. Sem intervenção manual em drift.
 */

const ENFORCED_ROUTES = [
  '/',
  '/bible',
  '/biblioteca',
  '/calendar',
  '/viacrucis',
  '/papas',
  '/auth',
  '/magisterium',
];

const TRACKED_ROUTES = [
  '/hoje',
  '/catechism',
  '/buscar',
  '/logos',
  '/temas',
  '/encyclopedia',
  '/glossary',
  '/santos',
  '/liturgia',
  '/rosary',
  '/litanies',
  '/onboarding',
];

const REPORT_DIR = path.join(process.cwd(), 'reports', 'axe-contrast');
if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

function slug(route: string) {
  return route.replace(/[^a-z0-9]+/gi, '_') || 'root';
}

async function runAxe(page: import('@playwright/test').Page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2aa', 'wcag21aa'])
    .withRules(['color-contrast'])
    .analyze();
}

type AxeViolations = Awaited<ReturnType<typeof runAxe>>['violations'];

function nodeSummaries(violations: AxeViolations) {
  return violations.flatMap((v) =>
    v.nodes.map((n) => `${v.id}: ${n.target.join(', ')} — ${n.failureSummary?.slice(0, 160)}`),
  );
}

function persist(route: string, tier: 'enforced' | 'tracked', violations: AxeViolations) {
  const payload = {
    route,
    tier,
    timestamp: new Date().toISOString(),
    totalNodes: violations.reduce((n, v) => n + v.nodes.length, 0),
    violations: violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        html: n.html?.slice(0, 500),
        failureSummary: n.failureSummary,
        any: n.any?.map((c) => ({ id: c.id, data: c.data })),
      })),
    })),
  };
  fs.writeFileSync(
    path.join(REPORT_DIR, `${tier}-${slug(route)}.json`),
    JSON.stringify(payload, null, 2),
  );
}

for (const route of ENFORCED_ROUTES) {
  test(`color-contrast [enforced] · ${route}`, async ({ page }, info) => {
    await page.goto(route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    const { violations } = await runAxe(page);
    persist(route, 'enforced', violations);
    const nodes = nodeSummaries(violations);

    await info.attach(`axe-contrast-enforced-${slug(route)}.json`, {
      body: JSON.stringify(violations, null, 2),
      contentType: 'application/json',
    });

    expect(nodes, `color-contrast regressions on ${route}:\n${nodes.join('\n')}`).toEqual([]);
  });
}

for (const route of TRACKED_ROUTES) {
  test(`color-contrast [tracked] · ${route}`, async ({ page }, info) => {
    await page.goto(route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    const { violations } = await runAxe(page);
    persist(route, 'tracked', violations);
    const nodes = nodeSummaries(violations);

    await info.attach(`axe-contrast-tracked-${slug(route)}.json`, {
      body: JSON.stringify(violations, null, 2),
      contentType: 'application/json',
    });

    if (nodes.length === 0) {
      // Rota tracked ficou limpa neste PR — força promoção para ENFORCED_ROUTES.
      throw new Error(
        `Route ${route} has 0 color-contrast violations. ` +
          `Move it from TRACKED_ROUTES to ENFORCED_ROUTES in ` +
          `tests/e2e/axe-color-contrast-regression.spec.ts to lock in the fix ` +
          `and block future regressions.`,
      );
    }

    console.warn(
      `[axe color-contrast · tracked] ${route}: ${nodes.length} nó(s) violando\n${nodes.join('\n')}`,
    );
    info.annotations.push({
      type: 'color-contrast-tracked',
      description: `${route}: ${nodes.length} nó(s)`,
    });
  });
}
