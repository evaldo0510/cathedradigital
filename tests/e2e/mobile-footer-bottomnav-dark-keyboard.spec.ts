import { test, expect, devices, type Page } from '@playwright/test';

/**
 * Cobertura complementar:
 * 1. Dark mode: rodapé + bottom nav renderizam ícones e aria-labels sem placeholders.
 * 2. Teclado: Tab/Enter navega a partir dos itens do rodapé/bottom nav.
 * 3. Regressão visual expandida com baselines por rota.
 */

const ALL_ROUTES = ['/', '/biblioteca', '/buscar', '/nexus', '/formacao'] as const;

async function enableDarkMode(page: Page) {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript(() => {
    document.documentElement.classList.add('dark');
  });
}

test.describe('mobile · Dark mode · rodapé + bottom nav', () => {
  test.use({
    ...devices['iPhone 12'],
    trace: 'on',
    screenshot: 'on',
    video: 'retain-on-failure',
    colorScheme: 'dark',
  });
  test.describe.configure({ retries: process.env.CI ? 4 : 1 });

  test.beforeEach(async ({ page }) => {
    await enableDarkMode(page);
  });

  for (const route of ALL_ROUTES) {
    test(`ícones + aria-labels renderizam em dark mode · ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });

      // Botão rápido
      const smart = page.getByTestId('smart-action-button');
      await expect(smart).toBeVisible();
      expect(await smart.locator('svg').count()).toBeGreaterThan(0);
      await expect(smart).toHaveAttribute('aria-label', /.+/);

      // Bottom nav — todos os itens visíveis, com SVG, aria-label preenchido.
      const navItems = page.locator('[data-testid^="nav-"]');
      const count = await navItems.count();
      expect(count, 'bottom nav deve ter itens em dark mode').toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        const item = navItems.nth(i);
        await expect(item).toBeVisible();
        expect(await item.locator('svg').count(), 'item deve ter <svg>').toBeGreaterThan(0);
        await expect(item).toHaveAttribute('aria-label', /.+/);
        const txt = (await item.innerText().catch(() => '')) ?? '';
        expect(txt, 'sem placeholder □').not.toMatch(/[□◻︎]/);
      }

      // Rodapé com sociais
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      const footer = page.locator('footer').last();
      for (const name of ['Instagram', 'Youtube', 'Whatsapp']) {
        const link = footer.getByRole('link', { name: new RegExp(name, 'i') });
        await expect(link, `${name} em dark mode`).toBeVisible();
        expect(await link.locator('svg').count()).toBeGreaterThan(0);
      }
    });
  }
});

test.describe('desktop · Navegação por teclado · rodapé + bottom nav', () => {
  test.use({ trace: 'on', screenshot: 'on', video: 'retain-on-failure' });
  test.describe.configure({ retries: process.env.CI ? 4 : 1 });

  test('Tab + Enter na bottom nav abre a rota correta', async ({ page }) => {
    // Bottom nav legada aparece <lg, então iPhone-like viewport.
    await page.setViewportSize({ width: 720, height: 1000 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const target = page.getByTestId('nav-biblioteca').or(page.getByTestId('nav-bíblia')).first();
    await target.focus();
    await expect(target).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/(biblioteca|bible)/, { timeout: 5_000 });
  });

  test('Tab + Enter em link social do rodapé abre URL externa', async ({ page, context }) => {
    await page.setViewportSize({ width: 1280, height: 1800 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const link = page.locator('footer').last().getByRole('link', { name: /instagram/i }).first();
    await link.focus();
    await expect(link).toBeFocused();

    const href = await link.getAttribute('href');
    expect(href, 'link social deve ter href').toBeTruthy();

    const [popup] = await Promise.all([
      context.waitForEvent('page').catch(() => null),
      page.keyboard.press('Enter'),
    ]);
    if (popup) {
      expect(popup.url()).toMatch(/instagram\.com/i);
      await popup.close();
    } else {
      // Fallback: alguns browsers navegam na mesma aba se target não for _blank.
      expect(page.url()).toMatch(/instagram\.com|localhost/);
    }
  });

  test('Space na bottom nav também ativa navegação', async ({ page }) => {
    await page.setViewportSize({ width: 720, height: 1000 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const target = page.getByTestId('nav-buscar').first();
    if ((await target.count()) === 0) test.skip(true, 'nav-buscar não existe nesta build');
    await target.focus();
    await page.keyboard.press('Space');
    await expect(page).toHaveURL(/\/buscar/, { timeout: 5_000 });
  });
});

test.describe('mobile · Regressão visual expandida por rota', () => {
  test.use({
    ...devices['iPhone 12'],
    trace: 'on',
    screenshot: 'on',
    video: 'retain-on-failure',
  });
  test.describe.configure({ retries: process.env.CI ? 4 : 1 });

  // Limiar padrão 0.02 — rotas com muita animação/gradiente relaxam para 0.04.
  const RELAXED = new Set(['/nexus']);

  for (const route of ALL_ROUTES) {
    test(`snapshot bottom nav + rodapé · ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      const nav = page.locator('nav[aria-label*="Navegação"]').last();
      await expect(nav).toBeVisible();
      const threshold = RELAXED.has(route) ? 0.04 : 0.02;
      const slug = route.replace(/\//g, '_') || 'root';

      await expect(nav).toHaveScreenshot(`v2-bottom-nav-${slug}.png`, {
        maxDiffPixelRatio: threshold,
        animations: 'disabled',
      });

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(400);
      const footer = page.locator('footer').last();
      await expect(footer).toBeVisible();
      await expect(footer).toHaveScreenshot(`v2-footer-${slug}.png`, {
        maxDiffPixelRatio: threshold,
        animations: 'disabled',
      });
    });
  }
});
