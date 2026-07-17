import { test, expect } from '@playwright/test';

/**
 * Navegação Voltar/Avançar do navegador entre rotas do menu do Átrio:
 * confirma que nenhuma tela fica em branco e que o conteúdo é restaurado.
 */

const ROUTES = ['/', '/bible', '/oracao', '/jornadas', '/buscar', '/hoje'] as const;

async function assertNotBlank(page: import('@playwright/test').Page, path: string) {
  const main = page.locator('main, [role="main"]').first();
  await expect(main, `rota ${path} deve ter <main>`).toBeVisible({ timeout: 15000 });
  const text = (await main.textContent())?.trim() || '';
  expect(text.length, `rota ${path} não pode estar em branco`).toBeGreaterThan(20);
}

for (const vp of [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'mobile',  width: 390,  height: 844 },
] as const) {
  test.describe(`Átrio history · ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('back/forward entre todas as rotas restaura conteúdo', async ({ page }) => {
      // caminho ida
      for (const r of ROUTES) {
        await page.goto(r);
        await assertNotBlank(page, r);
      }

      // volta uma a uma até a primeira
      for (let i = ROUTES.length - 2; i >= 0; i--) {
        await page.goBack();
        await expect(page).toHaveURL(new RegExp(ROUTES[i].replace('/', '\\/') + '$'));
        await assertNotBlank(page, ROUTES[i]);
      }

      // avança de volta até a última
      for (let i = 1; i < ROUTES.length; i++) {
        await page.goForward();
        await expect(page).toHaveURL(new RegExp(ROUTES[i].replace('/', '\\/') + '$'));
        await assertNotBlank(page, ROUTES[i]);
      }
    });

    test('back após clique no menu volta ao Átrio sem tela em branco', async ({ page }) => {
      await page.goto('/');
      const link = page.getByRole('link', { name: /Rezar/i }).first();
      await link.click();
      await expect(page).toHaveURL(/\/oracao/);
      await assertNotBlank(page, '/oracao');
      await page.goBack();
      await expect(page).toHaveURL(/\/$/);
      await assertNotBlank(page, '/');
    });
  });
}
