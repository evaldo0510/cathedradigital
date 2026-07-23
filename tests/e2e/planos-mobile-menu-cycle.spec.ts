import { test, expect, devices, Page } from '@playwright/test';

/**
 * Abre e reabre o menu mobile e confere que header/footer nunca expõem
 * links para /planos — apenas /pricing.
 */
test.use({ ...devices['Pixel 5'] });

async function assertNoPlanos(page: Page, scope: string) {
  const hrefs = await page.$$eval('header a[href], footer a[href], nav a[href]', (nodes) =>
    nodes.map((n) => (n as HTMLAnchorElement).getAttribute('href') ?? ''),
  );
  const bad = hrefs.filter((h) => /(^|\/)planos(\/|\?|#|$)/.test(h));
  expect(bad, `${scope}: links para /planos encontrados: ${bad.join(', ')}`).toEqual([]);
}

test.describe('Menu mobile — nenhum link para /planos', () => {
  test('abrir/fechar/reabrir o menu preserva a regra', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await assertNoPlanos(page, 'estado inicial');

    const toggle = page.locator('header button[aria-label*="menu" i]').first();
    if (!(await toggle.isVisible().catch(() => false))) {
      // Sem hambúrguer: valida BottomNav/footer diretamente e encerra.
      await assertNoPlanos(page, 'sem menu hambúrguer');
      return;
    }

    // Ciclo 1: abrir
    await toggle.click();
    await page.waitForTimeout(300);
    await assertNoPlanos(page, 'menu aberto (1)');

    // Fechar
    await toggle.click();
    await page.waitForTimeout(300);
    await assertNoPlanos(page, 'menu fechado (1)');

    // Ciclo 2: reabrir
    await toggle.click();
    await page.waitForTimeout(300);
    await assertNoPlanos(page, 'menu aberto (2)');
  });
});
