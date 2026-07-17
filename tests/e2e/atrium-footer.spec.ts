import { test, expect } from '@playwright/test';

/**
 * CathedralFooter deve aparecer em todas as rotas do menu do Átrio
 * (rotas reais após remapeamento) tanto após clique no menu quanto
 * ao recarregar a página.
 */

const MENU_ROUTES = [
  { label: /Rezar/i,          path: '/oracao'   },
  { label: /Formar[- ]?se/i,  path: '/jornadas' },
  { label: /Pesquisar/i,      path: '/buscar'   },
  { label: /Minha Jornada/i,  path: '/hoje'     },
] as const;

async function expectFooterVisible(page: import('@playwright/test').Page) {
  const footer = page.locator('footer').first();
  await expect(footer).toBeVisible({ timeout: 10000 });
  const text = (await footer.textContent())?.trim() || '';
  expect(text.length).toBeGreaterThan(0);
}

for (const vp of [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'mobile',  width: 390,  height: 844 },
] as const) {
  test.describe(`Footer nas rotas do Átrio · ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const r of MENU_ROUTES) {
      test(`clique em "${String(r.label)}" → rodapé visível`, async ({ page }) => {
        await page.goto('/');
        await page.getByRole('link', { name: r.label }).first().click();
        await expect(page).toHaveURL(new RegExp(r.path.replace('/', '\\/')));
        await expectFooterVisible(page);
      });

      test(`reload em ${r.path} → rodapé continua visível`, async ({ page }) => {
        await page.goto(r.path);
        await expectFooterVisible(page);
        await page.reload();
        await expectFooterVisible(page);
      });
    }
  });
}
