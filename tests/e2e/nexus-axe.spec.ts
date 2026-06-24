import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Auditoria axe-core nas rotas críticas do Nexus.
 * Roda em padrão e em alto contraste, em mobile/tablet/desktop.
 * Falha em qualquer violação WCAG 2.1 A/AA.
 *
 * Regras desabilitadas: nenhuma — preferimos quebrar e revisar caso a caso.
 */

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'desktop', width: 1280, height: 900 },
] as const;

const ROUTES = [
  { label: 'Gn 1', path: '/bible?book=Gn&ch=1' },
  { label: 'Mt 5', path: '/bible?book=Mt&ch=5' },
  { label: 'Jo 6', path: '/bible?book=Jo&ch=6' },
] as const;

async function openRoute(page: Page, path: string) {
  await page.goto(path);
  await page.waitForSelector('[data-testid^="verse-text-"]', { timeout: 20_000 });
}

async function setHighContrast(page: Page, on: boolean) {
  const current = await page.locator('html').getAttribute('data-nexus-contrast');
  const isOn = current === 'high';
  if (isOn !== on) await page.getByTestId('nexus-contrast-toggle').click();
}

async function runAxe(page: Page, label: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    // Escopo: cabeçalho da Bíblia + área de leitura
    .include('main, header')
    .analyze();

  if (results.violations.length > 0) {
    const summary = results.violations
      .map(
        (v) =>
          `• [${v.impact ?? 'n/a'}] ${v.id} — ${v.help} (${v.nodes.length} ocorrência${
            v.nodes.length > 1 ? 's' : ''
          })\n    ${v.helpUrl}`,
      )
      .join('\n');
    throw new Error(
      `axe-core encontrou ${results.violations.length} violação(ões) em "${label}":\n${summary}`,
    );
  }
  expect(results.violations).toEqual([]);
}

test.describe('axe-core: WCAG 2.1 A/AA', () => {
  for (const vp of VIEWPORTS) {
    test.describe(`viewport ${vp.name}`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      for (const route of ROUTES) {
        test(`${route.label} — padrão`, async ({ page }) => {
          await openRoute(page, route.path);
          await setHighContrast(page, false);
          await runAxe(page, `${vp.name} · ${route.label} · padrão`);
        });

        test(`${route.label} — alto contraste`, async ({ page }) => {
          await openRoute(page, route.path);
          await setHighContrast(page, true);
          await runAxe(page, `${vp.name} · ${route.label} · alto contraste`);
          await setHighContrast(page, false);
        });
      }
    });
  }
});
