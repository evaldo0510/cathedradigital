import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Regressão de color-contrast (axe-core) em TODAS as rotas públicas.
 *
 * - ENFORCED_ROUTES: falha o CI em qualquer violação `color-contrast`.
 *   Rotas já saneadas — protegem contra regressão.
 * - TRACKED_ROUTES: rodam a mesma auditoria e anexam o relatório JSON,
 *   mas NÃO falham o build. Servem como monitoramento até serem
 *   limpas e promovidas para ENFORCED_ROUTES.
 *
 * Ao corrigir uma rota, mova-a de TRACKED_ROUTES para ENFORCED_ROUTES
 * para bloquear regressões futuras.
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

async function runAxe(page: import('@playwright/test').Page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2aa', 'wcag21aa'])
    .withRules(['color-contrast'])
    .analyze();
}

function formatNodes(violations: Awaited<ReturnType<typeof runAxe>>['violations']) {
  return violations.flatMap((v) =>
    v.nodes.map((n) => `${v.id}: ${n.target.join(', ')} — ${n.failureSummary?.slice(0, 160)}`),
  );
}

for (const route of ENFORCED_ROUTES) {
  test(`color-contrast [enforced] · ${route}`, async ({ page }, info) => {
    await page.goto(route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    const results = await runAxe(page);
    const nodes = formatNodes(results.violations);

    await info.attach(`axe-contrast-enforced-${route.replace(/[^a-z0-9]+/gi, '_') || 'root'}.json`, {
      body: JSON.stringify(results.violations, null, 2),
      contentType: 'application/json',
    });

    expect(nodes, `color-contrast regressions on ${route}:\n${nodes.join('\n')}`).toEqual([]);
  });
}

for (const route of TRACKED_ROUTES) {
  test(`color-contrast [tracked] · ${route}`, async ({ page }, info) => {
    await page.goto(route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    const results = await runAxe(page);
    const nodes = formatNodes(results.violations);

    await info.attach(`axe-contrast-tracked-${route.replace(/[^a-z0-9]+/gi, '_') || 'root'}.json`, {
      body: JSON.stringify(results.violations, null, 2),
      contentType: 'application/json',
    });

    if (nodes.length > 0) {
      // Não falha o build — apenas registra para monitoramento.
      console.warn(
        `[axe color-contrast · tracked] ${route}: ${nodes.length} nó(s) violando\n${nodes.join('\n')}`,
      );
      info.annotations.push({
        type: 'color-contrast-tracked',
        description: `${route}: ${nodes.length} nó(s)`,
      });
    }
    expect(true).toBe(true);
  });
}
