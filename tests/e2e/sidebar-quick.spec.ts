import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';
import { captureConsole, writeConsoleReport } from './utils/console-rules';

/**
 * Sidebar quick E2E:
 * - Opens the sidebar via BottomNav menu trigger
 * - Validates every nav button has an icon (svg) and an aria-label
 * - Runs axe (wcag2a/wcag2aa) scoped to the sidebar nav
 * - Navigates to a sample of routes and asserts no real console errors
 * - Emits JSON reports under reports/console and reports/a11y for CI trend tracking
 */

const SLUG = 'sidebar-quick';

test('sidebar: ícones, rotas, axe e ausência de erros de console', async ({ page }, testInfo) => {
  const consoleCapture = captureConsole(page);

  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // Open the sidebar via the BottomNav "menu" trigger
  const trigger = page.getByTestId('menu-trigger');
  await expect(trigger).toBeVisible({ timeout: 10_000 });
  await trigger.click();

  const closeBtn = page.getByRole('button', { name: 'Fechar menu' });
  await expect(closeBtn).toBeVisible();

  const nav = page.locator('nav[role="navigation"]').first();
  await expect(nav).toBeVisible();

  // Each visible nav button must have an aria-label AND an svg icon
  const buttons = nav.locator('button:visible');
  const count = await buttons.count();
  expect(count, 'sidebar should expose nav buttons').toBeGreaterThan(0);

  let validated = 0;
  for (let i = 0; i < count; i++) {
    const btn = buttons.nth(i);
    const label = await btn.getAttribute('aria-label');
    if (!label) continue; // section collapsibles
    const svgCount = await btn.locator('svg').count();
    expect.soft(svgCount, `button "${label}" should render an icon svg`).toBeGreaterThan(0);
    validated++;
  }
  expect(validated, 'should validate at least 3 labeled nav entries').toBeGreaterThanOrEqual(3);

  // Axe scan scoped to the sidebar drawer
  const axeResults = await new AxeBuilder({ page })
    .include('nav[role="navigation"]')
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  // Persist a trend-friendly a11y report
  const a11yDir = path.resolve(process.cwd(), 'reports/a11y');
  fs.mkdirSync(a11yDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const a11yFile = path.join(a11yDir, `${SLUG}-${ts}.json`);
  fs.writeFileSync(
    a11yFile,
    JSON.stringify(
      {
        slug: SLUG,
        url: page.url(),
        timestamp: new Date().toISOString(),
        violationCount: axeResults.violations.length,
        violations: axeResults.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          helpUrl: v.helpUrl,
          nodes: v.nodes.length,
          targets: v.nodes.flatMap((n) => n.target),
        })),
        passes: axeResults.passes.length,
        incomplete: axeResults.incomplete.length,
      },
      null,
      2,
    ),
    'utf-8',
  );
  await testInfo.attach('sidebar-axe.json', { path: a11yFile, contentType: 'application/json' });

  const critical = axeResults.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  expect(critical, `critical/serious axe violations:\n${critical.map((v) => `${v.id} (${v.nodes.length})`).join('\n')}`).toEqual([]);

  // Navigate through 2 sample routes
  const labeledButtons = await nav.locator('button[aria-label]:visible').all();
  const navigable = labeledButtons.slice(0, 2);
  const visited: string[] = [];
  for (const btn of navigable) {
    const label = (await btn.getAttribute('aria-label')) || '';
    await btn.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(300);
    visited.push(`${label} -> ${page.url()}`);
    if (!(await closeBtn.isVisible().catch(() => false))) {
      await trigger.click().catch(() => {});
    }
  }

  // Persist a console report regardless of pass/fail
  const reportPath = writeConsoleReport(SLUG, {
    slug: SLUG,
    timestamp: new Date().toISOString(),
    visited,
    errorCount: consoleCapture.errors.length,
    realErrors: consoleCapture.errors,
    allMessages: consoleCapture.all,
  });
  await testInfo.attach('sidebar-console.json', { path: reportPath, contentType: 'application/json' });

  expect(
    consoleCapture.errors,
    `real console errors during sidebar nav:\n${consoleCapture.errors.map((e) => `[${e.type}] ${e.text}`).join('\n')}`,
  ).toEqual([]);
});
