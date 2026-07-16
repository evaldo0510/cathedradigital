import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Regressão de color-contrast (axe-core).
 *
 * Falha o CI se alguma das rotas listadas voltar a introduzir violações
 * `color-contrast` (WCAG 2.1 AA). Restrito a rotas já saneadas — expandir
 * a lista à medida que outras rotas forem corrigidas.
 *
 * Escopo intencional: apenas a regra `color-contrast`, para bloquear
 * regressões visuais sem acoplamento a outras auditorias a11y.
 */

const CLEAN_ROUTES = [
  '/',
  '/bible',
  '/biblioteca',
  '/calendar',
  '/viacrucis',
  '/papas',
  '/auth',
  '/magisterium',
];

for (const route of CLEAN_ROUTES) {
  test(`color-contrast regression · ${route}`, async ({ page }, info) => {
    await page.goto(route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .withRules(['color-contrast'])
      .analyze();

    await info.attach(`axe-contrast-${route.replace(/[^a-z0-9]+/gi, '_') || 'root'}.json`, {
      body: JSON.stringify(results.violations, null, 2),
      contentType: 'application/json',
    });

    const nodes = results.violations.flatMap((v) =>
      v.nodes.map((n) => `${v.id}: ${n.target.join(', ')} — ${n.failureSummary?.slice(0, 160)}`),
    );

    expect(nodes, `color-contrast regressions on ${route}:\n${nodes.join('\n')}`).toEqual([]);
  });
}
