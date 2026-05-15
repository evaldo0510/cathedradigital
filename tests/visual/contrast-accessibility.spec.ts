import { test, expect } from '@playwright/test';

const ROUTES = ['/', '/hoje', '/catecismo', '/perfil'];

test.describe('Acessibilidade e Contraste do Design System', () => {
  for (const route of ROUTES) {
    test(`Auditoria Visual de Contraste na rota: ${route}`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      // Test Light Theme
      await page.evaluate(() => document.documentElement.classList.remove('dark'));
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot(`${route.replace(/\//g, 'home')}-light-contrast.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02
      });

      // Test Dark Theme
      await page.evaluate(() => document.documentElement.classList.add('dark'));
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot(`${route.replace(/\//g, 'home')}-dark-contrast.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02
      });
    });
  }

  test('Consistência de Botões em diferentes estados', async ({ page }) => {
    await page.goto('/');
    
    // Check various button variants
    const buttons = page.locator('.btn-premium');
    const count = await buttons.count();
    
    if (count > 0) {
      await buttons.first().scrollIntoViewIfNeeded();
      
      // Light mode capture
      await page.evaluate(() => document.documentElement.classList.remove('dark'));
      await expect(buttons.first()).toHaveScreenshot('btn-premium-light.png');
      
      // Dark mode capture
      await page.evaluate(() => document.documentElement.classList.add('dark'));
      await expect(buttons.first()).toHaveScreenshot('btn-premium-dark.png');
    }
  });
});
