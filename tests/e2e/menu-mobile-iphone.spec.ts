import { test, expect } from '@playwright/test';

/**
 * Menu mobile em múltiplos viewports iPhone.
 * Valida abrir/fechar Sidebar e navegação do BottomNav sem 404.
 *
 * Nota: os viewports iPhone (SE/8/13) já existem como projetos no
 * playwright.config.ts. Esta suíte roda de forma explícita em cada um
 * usando test.use() para simular sem depender do project name.
 */

const IPHONE_VIEWPORTS = [
  { name: 'iPhone SE', width: 320, height: 568, dpr: 2 },
  { name: 'iPhone 8',  width: 375, height: 667, dpr: 2 },
  { name: 'iPhone 13', width: 390, height: 844, dpr: 3 },
] as const;

const BOTTOM_NAV_ROUTES = [
  { testid: 'nav-bíblia',   expected: /^\/bible/ },
  { testid: 'nav-orações',  expected: /^\/oracao/ },
  { testid: 'nav-buscar',   expected: /^\/buscar/ },
  { testid: 'nav-jornadas', expected: /^\/jornadas/ },
] as const;

for (const vp of IPHONE_VIEWPORTS) {
  test.describe(`Menu mobile · ${vp.name} (${vp.width}×${vp.height})`, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.dpr,
      hasTouch: true,
      isMobile: true,
    });

    test('abre e fecha a Sidebar sem erros', async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await page.goto('/', { waitUntil: 'domcontentloaded' });

      const trigger = page.getByTestId('menu-trigger');
      await expect(trigger).toBeVisible({ timeout: 10000 });
      await trigger.click();

      const dialog = page.getByRole('dialog', { name: /Menu de navegação|navigation_menu/i });
      await expect(dialog).toBeVisible({ timeout: 5000 });

      await page.getByRole('button', { name: /Fechar menu/i }).click();
      await expect(dialog).toBeHidden({ timeout: 5000 });

      const has404 = consoleErrors.some((t) => /404:\s*rota inexistente/.test(t));
      expect(has404, `console errors: ${consoleErrors.join(' | ')}`).toBe(false);
    });

    for (const item of BOTTOM_NAV_ROUTES) {
      test(`BottomNav ${item.testid} → ${item.expected} sem 404`, async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('console', (msg) => {
          if (msg.type() === 'error') consoleErrors.push(msg.text());
        });

        await page.goto('/', { waitUntil: 'domcontentloaded' });

        const btn = page.getByTestId(item.testid);
        await expect(btn).toBeVisible({ timeout: 10000 });

        await Promise.all([
          page.waitForURL(item.expected, { timeout: 15000 }),
          btn.click(),
        ]);

        await expect(page.locator('text=/página não encontrada|not\\s*found/i')).toHaveCount(0);
        await expect(page.getByRole('heading', { name: '404' })).toHaveCount(0);

        const has404 = consoleErrors.some((t) => /404:\s*rota inexistente/.test(t));
        expect(has404, `console errors: ${consoleErrors.join(' | ')}`).toBe(false);
      });
    }
  });
}
