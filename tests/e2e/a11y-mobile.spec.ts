import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Auditoria WCAG 2.1 A/AA em rotas mobile críticas do Cathedra.
 *
 * Gate:
 *   - Falha o build em violações `serious` ou `critical`.
 *   - `moderate` e `minor` são registrados no relatório mas NÃO bloqueiam.
 *
 * Evidências:
 *   - JSON por rota em reports/a11y-mobile/<rota>.json
 *   - Screenshot da rota quando houver violação bloqueante
 *   - Sumário agregado em reports/a11y-mobile/summary.json
 */

const MOBILE_VIEWPORT = { width: 390, height: 844 }; // iPhone 12/13/14

const ROUTES: ReadonlyArray<{ label: string; path: string; waitFor?: string }> = [
  { label: 'atrio', path: '/' },
  { label: 'biblia', path: '/bible?book=Gn&ch=1', waitFor: '[data-testid^="verse-text-"]' },
  { label: 'catecismo', path: '/catechism?p=1' },
  { label: 'buscar', path: '/buscar' },
  { label: 'biblioteca', path: '/biblioteca' },
  { label: 'formacao', path: '/formacao' },
  { label: 'santos', path: '/saints' },
  { label: 'rosario', path: '/rosary' },
  { label: 'viacrucis', path: '/viacrucis' },
  { label: 'missal', path: '/missal' },
  { label: 'breviario', path: '/breviary' },
  { label: 'ladainhas', path: '/litanies' },
  { label: 'oracoes', path: '/oracao' },
  { label: 'comunidade', path: '/community' },
];

const REPORT_DIR = path.resolve(process.cwd(), 'reports/a11y-mobile');
const BLOCKING = new Set(['serious', 'critical']);

type Violation = Awaited<ReturnType<InstanceType<typeof AxeBuilder>['analyze']>>['violations'][number];

interface RouteResult {
  label: string;
  path: string;
  blocking: Violation[];
  warnings: Violation[];
}

const results: RouteResult[] = [];

test.beforeAll(() => {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
});

test.afterAll(() => {
  const summary = {
    generatedAt: new Date().toISOString(),
    viewport: MOBILE_VIEWPORT,
    gate: 'serious+critical',
    totals: {
      routes: results.length,
      routesWithBlocking: results.filter((r) => r.blocking.length > 0).length,
      blocking: results.reduce((n, r) => n + r.blocking.length, 0),
      warnings: results.reduce((n, r) => n + r.warnings.length, 0),
    },
    routes: results.map((r) => ({
      label: r.label,
      path: r.path,
      blocking: r.blocking.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length })),
      warnings: r.warnings.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length })),
    })),
  };
  fs.writeFileSync(path.join(REPORT_DIR, 'summary.json'), JSON.stringify(summary, null, 2));
});

async function auditRoute(page: Page, route: (typeof ROUTES)[number]): Promise<RouteResult> {
  await page.goto(route.path, { waitUntil: 'domcontentloaded' });
  if (route.waitFor) {
    await page.waitForSelector(route.waitFor, { timeout: 15_000 }).catch(() => undefined);
  }
  await page.waitForTimeout(500); // deixa animações estabilizarem

  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const blocking = axe.violations.filter((v) => BLOCKING.has(v.impact ?? ''));
  const warnings = axe.violations.filter((v) => !BLOCKING.has(v.impact ?? ''));

  fs.writeFileSync(
    path.join(REPORT_DIR, `${route.label}.json`),
    JSON.stringify({ path: route.path, violations: axe.violations }, null, 2),
  );

  if (blocking.length > 0) {
    await page.screenshot({ path: path.join(REPORT_DIR, `${route.label}.png`), fullPage: false });
  }

  return { label: route.label, path: route.path, blocking, warnings };
}

test.describe('a11y-mobile · WCAG 2.1 AA (gate: serious+critical)', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  for (const route of ROUTES) {
    test(`${route.label} (${route.path})`, async ({ page }) => {
      const result = await auditRoute(page, route);
      results.push(result);

      if (result.warnings.length > 0) {
        console.warn(
          `[a11y-mobile] ${result.label}: ${result.warnings.length} warning(s) (moderate/minor) — não bloqueia:\n` +
            result.warnings.map((v) => `  · ${v.id} [${v.impact}] — ${v.help}`).join('\n'),
        );
      }

      if (result.blocking.length > 0) {
        const detail = result.blocking
          .map(
            (v) =>
              `• [${v.impact}] ${v.id} — ${v.help} (${v.nodes.length} ocorrência${v.nodes.length > 1 ? 's' : ''})\n    ${v.helpUrl}`,
          )
          .join('\n');
        throw new Error(
          `[${result.label}] ${result.blocking.length} violação(ões) serious/critical em ${result.path}:\n${detail}`,
        );
      }

      expect(result.blocking).toEqual([]);
    });
  }
});
