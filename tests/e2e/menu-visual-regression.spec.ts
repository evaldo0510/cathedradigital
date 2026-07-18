import { test, expect, devices, type Page, type TestInfo } from '@playwright/test';
import { auditMaskCoverage, volatileMasks } from './helpers/visual-masks';

/**
 * Regressão visual do menu — desktop + iPhone SE + iPhone 13, em light e dark.
 *
 * IMPORTANTE:
 * - Roda APENAS em Chromium para evitar diffs entre engines.
 * - Dark mode aplicado via `document.documentElement.classList.add('dark')`
 *   (Tailwind `darkMode: ["class"]`) ANTES de qualquer render, via initScript.
 * - Masks vêm de tests/e2e/helpers/visual-masks.ts (testids + fallbacks estruturais).
 *
 * Baseline: `bunx playwright test menu-visual-regression --update-snapshots --project=chromium`
 */

test.describe.configure({ mode: 'serial' });

test.skip(
  ({ browserName }) => browserName !== 'chromium',
  'Regressão visual roda apenas em Chromium para evitar diffs entre engines',
);

const SNAPSHOT_OPTIONS = {
  maxDiffPixelRatio: 0.01,
  animations: 'disabled' as const,
  caret: 'hide' as const,
};

type Theme = 'light' | 'dark';

/** Aplica o tema ANTES do primeiro paint para evitar flash claro no snapshot. */
async function applyTheme(page: Page, theme: Theme) {
  await page.addInitScript((t) => {
    try {
      const root = document.documentElement;
      root.classList.remove('dark', 'light');
      root.classList.add(t);
      root.setAttribute('data-theme', t);
      // Persistência comum em apps que leem localStorage no boot.
      localStorage.setItem('theme', t);
      localStorage.setItem('vite-ui-theme', t);
    } catch {}
  }, theme);
  await page.emulateMedia({ colorScheme: theme });
}

async function prepare(page: Page, testInfo: TestInfo, theme: Theme) {
  await applyTheme(page, theme);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  // Confirma que a classe foi aplicada (fail-fast se o app resetar no boot).
  await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${theme}\\b`), { timeout: 3000 }).catch(() => {
    // Não falha aqui — o snapshot em si vai reprovar se o tema divergir.
  });
  await auditMaskCoverage(page, testInfo);
}

const THEMES: Theme[] = ['light', 'dark'];

for (const theme of THEMES) {
  test.describe(`Menu · desktop · ${theme} (Chromium)`, () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test(`desktop ${theme} · sidebar fechada`, async ({ page }, testInfo) => {
      await prepare(page, testInfo, theme);
      await expect(page).toHaveScreenshot(`menu-desktop-${theme}-closed.png`, {
        ...SNAPSHOT_OPTIONS,
        mask: volatileMasks(page),
        fullPage: false,
      });
    });

    test(`desktop ${theme} · sidebar aberta`, async ({ page }, testInfo) => {
      await prepare(page, testInfo, theme);
      const trigger = page
        .getByTestId('menu-trigger')
        .or(page.getByRole('button', { name: /menu|abrir menu/i }));
      if (await trigger.count()) {
        await trigger.first().click().catch(() => {});
        await page.waitForTimeout(400);
      }
      await expect(page).toHaveScreenshot(`menu-desktop-${theme}-open.png`, {
        ...SNAPSHOT_OPTIONS,
        mask: volatileMasks(page),
        fullPage: false,
      });
    });
  });
}

// Matriz mobile: SE (320×568) e iPhone 13 (390×844).
const MOBILE_VIEWPORTS = [
  { slug: 'se', device: { ...devices['iPhone SE'], viewport: { width: 320, height: 568 } } },
  { slug: 'iphone-13', device: { ...devices['iPhone 13'] } },
] as const;

for (const vp of MOBILE_VIEWPORTS) {
  for (const theme of THEMES) {
    test.describe(`Menu · mobile ${vp.slug} · ${theme} (Chromium)`, () => {
      test.use(vp.device);

      test(`mobile ${vp.slug} ${theme} · bottom nav fechado`, async ({ page }, testInfo) => {
        await prepare(page, testInfo, theme);
        await expect(page).toHaveScreenshot(`menu-mobile-${vp.slug}-${theme}-closed.png`, {
          ...SNAPSHOT_OPTIONS,
          mask: volatileMasks(page),
          fullPage: false,
        });
      });

      test(`mobile ${vp.slug} ${theme} · sidebar aberta`, async ({ page }, testInfo) => {
        await prepare(page, testInfo, theme);
        await page.getByTestId('menu-trigger').click();
        await expect(
          page.getByRole('dialog', { name: /Menu de navegação|navigation_menu/i }),
        ).toBeVisible({ timeout: 5000 });
        await page.waitForTimeout(700);

        await expect(page).toHaveScreenshot(`menu-mobile-${vp.slug}-${theme}-open.png`, {
          ...SNAPSHOT_OPTIONS,
          mask: volatileMasks(page),
          fullPage: false,
        });
      });
    });
  }
}
