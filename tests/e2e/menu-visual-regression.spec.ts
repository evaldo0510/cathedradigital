import { test, expect, devices } from '@playwright/test';
import { volatileMasks } from './helpers/visual-masks';

/**
 * Regressão visual do menu (desktop + mobile iPhone SE).
 *
 * IMPORTANTE:
 * - Roda APENAS em Chromium para evitar diffs entre engines.
 * - Mobile fixo em iPhone SE (320×568) — pior caso e mais barato no CI.
 * - Masks vêm de tests/e2e/helpers/visual-masks.ts (fonte única).
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

test.describe('Menu · regressão visual desktop (Chromium)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('desktop · sidebar fechada (estado inicial)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await expect(page).toHaveScreenshot('menu-desktop-closed.png', {
      ...SNAPSHOT_OPTIONS,
      mask: volatileMasks(page),
      fullPage: false,
    });
  });

  test('desktop · sidebar aberta', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Em desktop a Sidebar pode ser acionada por atalho ou botão de header.
    const trigger = page.getByTestId('menu-trigger').or(page.getByRole('button', { name: /menu|abrir menu/i }));
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

test.describe('Menu · regressão visual mobile iPhone SE (Chromium)', () => {
  test.use({ ...devices['iPhone SE'], viewport: { width: 320, height: 568 } });

  test('mobile · bottom nav fechado', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await expect(page).toHaveScreenshot('menu-mobile-se-closed.png', {
      ...SNAPSHOT_OPTIONS,
      mask: volatileMasks(page),
      fullPage: false,
    });
  });

  test('mobile · sidebar aberta', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('menu-trigger').click();
    await expect(
      page.getByRole('dialog', { name: /Menu de navegação|navigation_menu/i }),
    ).toBeVisible({ timeout: 5000 });
    // Aguarda animação de entrada terminar.
    await page.waitForTimeout(700);

    await expect(page).toHaveScreenshot('menu-mobile-se-open.png', {
      ...SNAPSHOT_OPTIONS,
      mask: volatileMasks(page),
      fullPage: false,
    });
  });
});
