import { test, expect, devices } from '@playwright/test';

/**
 * Menu em viewport mobile:
 * - BottomNav visível
 * - Botão "Mais" abre a Sidebar (role=dialog)
 * - Fechar via botão X e via ESC
 * - Rotas do BottomNav e da Sidebar navegam sem 404 / NotFound
 */

test.use({ ...devices['Pixel 5'], viewport: { width: 393, height: 851 } });

const BOTTOM_NAV_ROUTES = [
  { testid: 'nav-bíblia',   expected: /^\/bible/ },
  { testid: 'nav-orações',  expected: /^\/oracao/ },
  { testid: 'nav-buscar',   expected: /^\/buscar/ },
  { testid: 'nav-jornadas', expected: /^\/jornadas/ },
] as const;

async function assertNoNotFound(page: import('@playwright/test').Page) {
  await expect(page.locator('text=/página não encontrada|not\\s*found/i')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '404' })).toHaveCount(0);
}

function collect404s(page: import('@playwright/test').Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && /404:\s*rota inexistente/.test(msg.text())) {
      errors.push(msg.text());
    }
  });
  return errors;
}

test.describe('Menu mobile · abrir/fechar sidebar', () => {
  test('BottomNav visível e "Mais" abre a Sidebar', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const bottomNav = page.getByRole('navigation', { name: /Navegação móvel|mobile_navigation/i });
    await expect(bottomNav).toBeVisible({ timeout: 10000 });

    const menuTrigger = page.getByTestId('menu-trigger');
    await expect(menuTrigger).toBeVisible();
    await menuTrigger.click();

    const dialog = page.getByRole('dialog', { name: /Menu de navegação|navigation_menu/i });
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });

  test('Sidebar fecha via botão X', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('menu-trigger').click();

    const dialog = page.getByRole('dialog', { name: /Menu de navegação|navigation_menu/i });
    await expect(dialog).toBeVisible();

    await page.getByRole('button', { name: /Fechar menu/i }).click();
    await expect(dialog).toBeHidden({ timeout: 5000 });
  });

  test('Sidebar fecha via ESC', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('menu-trigger').click();

    const dialog = page.getByRole('dialog', { name: /Menu de navegação|navigation_menu/i });
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden({ timeout: 5000 });
  });
});

test.describe('Menu mobile · BottomNav navega sem 404', () => {
  for (const item of BOTTOM_NAV_ROUTES) {
    test(`clicar em ${item.testid} → ${item.expected}`, async ({ page }) => {
      const errors = collect404s(page);
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      const btn = page.getByTestId(item.testid);
      await expect(btn).toBeVisible({ timeout: 10000 });

      await Promise.all([
        page.waitForURL(item.expected, { timeout: 15000 }),
        btn.click(),
      ]);

      await assertNoNotFound(page);
      expect(errors, `404 no console: ${errors.join(' | ')}`).toHaveLength(0);
    });
  }
});

test.describe('Menu mobile · Sidebar navega sem 404', () => {
  const SIDEBAR_ROUTES = ['/bible', '/oracao', '/buscar', '/jornadas', '/hoje'] as const;

  for (const path of SIDEBAR_ROUTES) {
    test(`link da Sidebar → ${path}`, async ({ page }) => {
      const errors = collect404s(page);
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      await page.getByTestId('menu-trigger').click();
      const dialog = page.getByRole('dialog', { name: /Menu de navegação|navigation_menu/i });
      await expect(dialog).toBeVisible();

      // Todos os itens de navegação da sidebar são <button> com href-like via handleNav.
      // Selecionamos pelo aria-label mais tolerante e restringimos ao dialog.
      const link = dialog.locator(`a[href="${path}"], button[data-route="${path}"]`).first();

      if (await link.count() === 0) {
        // Fallback: buscar pelo texto do label conforme a rota
        const labelMap: Record<string, RegExp> = {
          '/bible':    /Bíblia/i,
          '/oracao':   /Orações|Rezar/i,
          '/buscar':   /Busca|Pesquisar/i,
          '/jornadas': /Jornadas|Formação|Formar/i,
          '/hoje':     /Hoje|Diário/i,
        };
        const byText = dialog.getByRole('button', { name: labelMap[path] }).first();
        await expect(byText, `item da sidebar para ${path}`).toBeVisible({ timeout: 5000 });
        await Promise.all([
          page.waitForURL(new RegExp(path.replace(/\//g, '\\/') + '(\\?|$|#)'), { timeout: 15000 }),
          byText.click(),
        ]);
      } else {
        await Promise.all([
          page.waitForURL(new RegExp(path.replace(/\//g, '\\/') + '(\\?|$|#)'), { timeout: 15000 }),
          link.click(),
        ]);
      }

      expect(new URL(page.url()).pathname).toBe(path);
      await assertNoNotFound(page);
      expect(errors, `404 no console: ${errors.join(' | ')}`).toHaveLength(0);
    });
  }
});
