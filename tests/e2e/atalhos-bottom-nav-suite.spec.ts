import { test, expect, devices, type Page } from '@playwright/test';

/**
 * Suite Atalhos (bottom nav integrado — substituto do antigo FAB):
 *  1. Click abre o Sheet e o conteúdo esperado aparece.
 *  2. aria-label correto + foco visível via Tab, e Sheet devolve o foco ao trigger no close.
 *  3. Regressão visual da bottom nav em todas as rotas principais, light e dark.
 */

const ROUTES = ['/', '/biblioteca', '/buscar', '/nexus', '/formacao'] as const;

async function gotoAndSettle(page: Page, route: string) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  // Aguarda a nav estar montada antes de qualquer asserção.
  await page.locator('nav.bottom-nav, nav[aria-label*="Navegação"i]').first().waitFor({ timeout: 5_000 }).catch(() => {});
}

// -------------------------------------------------------------
// 1) Click abre Sheet com o conteúdo esperado
// -------------------------------------------------------------
test.describe('mobile · Atalhos · abre Sheet com conteúdo correto', () => {
  test.use({ ...devices['iPhone 12'] });

  test('click no item Atalhos abre Sheet e revela os 4 atalhos', async ({ page }) => {
    await gotoAndSettle(page, '/formacao');

    const trigger = page.getByTestId('smart-action-button');
    await expect(trigger).toBeVisible();
    await trigger.click();

    // Sheet aberto
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/atalhos rápidos/i)).toBeVisible();

    // Os 4 tiles esperados
    for (const key of ['buscar', 'oracao', 'diario', 'favoritos']) {
      const tile = page.getByTestId(`smart-action-${key}`);
      await expect(tile, `tile ${key}`).toBeVisible();
      expect(await tile.locator('svg').count()).toBeGreaterThan(0);
    }
  });
});

// -------------------------------------------------------------
// 2) a11y — aria-label, foco visível e devolução de foco
// -------------------------------------------------------------
test.describe('mobile · Atalhos · a11y e foco', () => {
  test.use({ ...devices['iPhone 12'] });

  test('aria-label do item Atalhos', async ({ page }) => {
    await gotoAndSettle(page, '/');
    const trigger = page.getByTestId('smart-action-button');
    await expect(trigger).toHaveAttribute('aria-label', /atalhos/i);
  });

  test('foco visível via Tab', async ({ page }) => {
    await gotoAndSettle(page, '/');
    const trigger = page.getByTestId('smart-action-button');

    await trigger.focus();
    await expect(trigger).toBeFocused();

    const style = await trigger.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        outlineStyle: cs.outlineStyle,
        outlineWidth: cs.outlineWidth,
        boxShadow: cs.boxShadow,
        bg: cs.backgroundColor,
      };
    });
    const hasOutline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
    const hasRing = !!style.boxShadow && style.boxShadow !== 'none';
    const hasBg = !!style.bg && style.bg !== 'rgba(0, 0, 0, 0)' && style.bg !== 'transparent';
    expect(hasOutline || hasRing || hasBg, `foco invisível: ${JSON.stringify(style)}`).toBe(true);
  });

  test('Sheet devolve o foco ao trigger ao fechar (sem foco perdido)', async ({ page }) => {
    await gotoAndSettle(page, '/');
    const trigger = page.getByTestId('smart-action-button');
    await trigger.focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Fecha com Escape
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    // O foco NÃO pode ir para <body> — Radix devolve ao trigger.
    const active = await page.evaluate(() => ({
      tag: document.activeElement?.tagName,
      testid: document.activeElement?.getAttribute('data-testid') ?? '',
    }));
    expect(active.tag, 'foco não pode voltar ao body').not.toBe('BODY');
    expect(active.testid).toBe('smart-action-button');
  });
});

// -------------------------------------------------------------
// 3) Regressão visual — bottom nav em todas as rotas, light + dark
// -------------------------------------------------------------
test.describe('mobile · Atalhos · regressão visual bottom nav', () => {
  test.use({ ...devices['iPhone 12'] });

  for (const scheme of ['light', 'dark'] as const) {
    for (const route of ROUTES) {
      test(`bottom nav · ${scheme} · ${route}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        if (scheme === 'dark') {
          await page.addInitScript(() => document.documentElement.classList.add('dark'));
        }
        await gotoAndSettle(page, route);

        const nav = page.locator('nav.bottom-nav').first();
        await expect(nav).toBeVisible();
        // O item Atalhos deve estar presente na nav.
        await expect(nav.getByTestId('smart-action-button')).toBeVisible();

        const safeRoute = route === '/' ? 'root' : route.replace(/\//g, '-').replace(/^-/, '');
        await expect(nav).toHaveScreenshot(`bottom-nav-atalhos-${scheme}-${safeRoute}.png`, {
          maxDiffPixelRatio: 0.05,
          animations: 'disabled',
        });
      });
    }
  }
});
