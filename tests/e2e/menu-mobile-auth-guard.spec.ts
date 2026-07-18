import { test, expect, devices } from '@playwright/test';

/**
 * Navegação pelo menu mobile para rotas protegidas por AuthGuard.
 * Sem sessão: deve redirecionar para /auth (ou /login) sem NotFound
 * nem "404: rota inexistente" no console.
 */

test.use({ ...devices['Pixel 5'], viewport: { width: 393, height: 851 } });

const GUARDED_ROUTES = ['/diario', '/favorites', '/achievements', '/profile', '/settings'] as const;

test.describe('Menu mobile · rotas com AuthGuard', () => {
  for (const path of GUARDED_ROUTES) {
    test(`abrir Sidebar → ${path} redireciona para /auth sem 404`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await page.goto('/', { waitUntil: 'domcontentloaded' });

      // Abre a Sidebar mobile.
      await page.getByTestId('menu-trigger').click();
      const dialog = page.getByRole('dialog', { name: /Menu de navegação|navigation_menu/i });
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Tenta encontrar o link dentro do dialog. Fallback: navegar direto pela URL.
      const link = dialog.locator(`a[href="${path}"], button[data-route="${path}"]`).first();
      if (await link.count()) {
        await Promise.all([
          page.waitForURL(/\/(auth|login)/, { timeout: 15000 }),
          link.click(),
        ]);
      } else {
        // Rota não exposta na Sidebar mobile: valida direto via URL.
        await page.goto(path, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      }

      const finalPath = new URL(page.url()).pathname;
      expect(finalPath, `pathname final para ${path}`).toMatch(/^\/(auth|login)/);

      await expect(page.locator('text=/página não encontrada|not\\s*found/i')).toHaveCount(0);
      await expect(page.getByRole('heading', { name: '404' })).toHaveCount(0);

      const has404 = consoleErrors.some((t) => /404:\s*rota inexistente/.test(t));
      expect(has404, `console errors: ${consoleErrors.join(' | ')}`).toBe(false);
    });
  }
});
