import { test, expect, devices } from '@playwright/test';
import { auditMaskCoverage, volatileMasks } from './helpers/visual-masks';

/**
 * Regressão visual do menu (desktop + iPhone SE + iPhone 13).
 *
 * IMPORTANTE:
 * - Roda APENAS em Chromium para evitar diffs entre engines.
 * - Cobre dois viewports mobile críticos: iPhone SE (pior caso 320w) e iPhone 13 (390w).
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

async function prepare(page: import('@playwright/test').Page, testInfo: import('@playwright/test').TestInfo) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  // Auditoria de cobertura de máscaras — anexa relatório e loga no-ops.
  await auditMaskCoverage(page, testInfo);
}

test.describe('Menu · regressão visual desktop (Chromium)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('desktop · sidebar fechada (estado inicial)', async ({ page }, testInfo) => {
    await prepare(page, testInfo);
    await expect(page).toHaveScreenshot('menu-desktop-closed.png', {
      ...SNAPSHOT_OPTIONS,
      mask: volatileMasks(page),
      fullPage: false,
    });
  });

  test('desktop · sidebar aberta', async ({ page }, testInfo) => {
    await prepare(page, testInfo);
    const trigger = page
      .getByTestId('menu-trigger')
      .or(page.getByRole('button', { name: /menu|abrir menu/i }));
    if (await trigger.count()) {
      await trigger.first().click().catch(() => {});
      await page.waitForTimeout(400);
    }
    await expect(page).toHaveScreenshot('menu-desktop-open.png', {
      ...SNAPSHOT_OPTIONS,
      mask: volatileMasks(page),
      fullPage: false,
    });
  });
});

// Matriz de viewports mobile: SE (320×568) e iPhone 13 (390×844).
const MOBILE_VIEWPORTS = [
  { name: 'iPhone SE', slug: 'se', device: { ...devices['iPhone SE'], viewport: { width: 320, height: 568 } } },
  { name: 'iPhone 13', slug: 'iphone-13', device: { ...devices['iPhone 13'] } },
] as const;

for (const vp of MOBILE_VIEWPORTS) {
  test.describe(`Menu · regressão visual mobile ${vp.name} (Chromium)`, () => {
    test.use(vp.device);

    test(`mobile ${vp.slug} · bottom nav fechado`, async ({ page }, testInfo) => {
      await prepare(page, testInfo);
      await expect(page).toHaveScreenshot(`menu-mobile-${vp.slug}-closed.png`, {
        ...SNAPSHOT_OPTIONS,
        mask: volatileMasks(page),
        fullPage: false,
      });
    });

    test(`mobile ${vp.slug} · sidebar aberta`, async ({ page }, testInfo) => {
      await prepare(page, testInfo);
      await page.getByTestId('menu-trigger').click();
      await expect(
        page.getByRole('dialog', { name: /Menu de navegação|navigation_menu/i }),
      ).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(700);

      await expect(page).toHaveScreenshot(`menu-mobile-${vp.slug}-open.png`, {
        ...SNAPSHOT_OPTIONS,
        mask: volatileMasks(page),
        fullPage: false,
      });
    });
  });
}
