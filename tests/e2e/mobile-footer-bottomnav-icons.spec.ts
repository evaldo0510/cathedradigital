import { test, expect, devices, type Page, type Locator } from '@playwright/test';

/**
 * Cobertura E2E dos ícones/rodapé e do botão rápido (SmartActionButton).
 *
 * O que este spec valida:
 * 1. Botão rápido abre a Sheet e navega para as rotas dos atalhos.
 * 2. Ícones da bottom nav e do rodapé renderizam <svg> real (sem □/quadrado
 *    vazio) e possuem aria-label/nome acessível quando aplicável.
 * 3. Regressão visual: screenshot do rodapé e da bottom nav em rotas
 *    problemáticas, comparado automaticamente entre execuções.
 *
 * Roda em viewport mobile (iPhone 12) porque a bottom nav legada
 * (`src/components/cathedra/BottomNav.tsx`) só é exibida abaixo de `lg`.
 */

const ROUTES_WITH_NAV = ['/', '/biblioteca', '/buscar', '/nexus', '/formacao'] as const;

const FOOTER_SOCIALS = [
  { label: 'Instagram' },
  { label: 'Youtube' },
  { label: 'Whatsapp' },
] as const;

const BOTTOM_NAV_ITEMS = [
  { testid: 'nav-átrio', label: 'Átrio' },
  { testid: 'nav-biblioteca', label: 'Biblioteca' },
  { testid: 'nav-buscar', label: 'Buscar' },
  { testid: 'nav-nexus', label: 'Nexus' },
  { testid: 'nav-formação', label: 'Formação' },
] as const;

async function assertVisibleSvg(locator: Locator, name: string) {
  await expect(locator, `${name} deve renderizar`).toBeVisible();
  const svgCount = await locator.locator('svg').count();
  expect(svgCount, `${name} deve conter pelo menos 1 <svg>`).toBeGreaterThan(0);
  // Nenhum placeholder visível (□ literal ou "?") no elemento.
  const text = (await locator.innerText().catch(() => '')) ?? '';
  expect(text, `${name} não deve exibir placeholder □/?`).not.toMatch(/[□◻︎]/);
}

test.describe('mobile · Botão rápido (SmartActionButton) e navegação', () => {
  test.use({
    ...devices['iPhone 12'],
    trace: 'on',
    screenshot: 'on',
    video: 'retain-on-failure',
  });
  test.describe.configure({ retries: process.env.CI ? 4 : 1 });

  test('abre a Sheet de atalhos e navega para /diario', async ({ page }) => {
    await page.goto('/formacao', { waitUntil: 'domcontentloaded' });

    const trigger = page.getByTestId('smart-action-button');
    await assertVisibleSvg(trigger, 'Botão rápido');
    await expect(trigger).toHaveAttribute('aria-label', /atalhos rápidos/i);

    await trigger.click();

    const diarioTile = page.getByTestId('smart-action-diario');
    await assertVisibleSvg(diarioTile, 'Atalho Diário');
    await diarioTile.click();

    await expect(page).toHaveURL(/\/diario/, { timeout: 5_000 });
  });

  test('atalho de Oração navega para /oracao', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('smart-action-button').click();
    await page.getByTestId('smart-action-oracao').click();
    await expect(page).toHaveURL(/\/oracao/, { timeout: 5_000 });
  });
});

test.describe('mobile · Ícones da bottom nav e do rodapé', () => {
  test.use({
    ...devices['iPhone 12'],
    trace: 'on',
    screenshot: 'on',
    video: 'retain-on-failure',
  });
  test.describe.configure({ retries: process.env.CI ? 4 : 1 });

  for (const route of ROUTES_WITH_NAV) {
    test(`todos os ícones (bottom nav + rodapé) renderizam em ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });

      // Botão rápido presente e com SVG.
      await assertVisibleSvg(page.getByTestId('smart-action-button'), 'Botão rápido');

      // Bottom nav: cada item precisa estar visível, com <svg> e aria-label.
      for (const item of BOTTOM_NAV_ITEMS) {
        const btn = page.getByTestId(item.testid);
        // Nem todo item existe em todas as versões da nav; se existir, valida.
        if ((await btn.count()) === 0) continue;
        await assertVisibleSvg(btn, `Bottom nav · ${item.label}`);
        await expect(btn, `Bottom nav · ${item.label} deve ter aria-label`).toHaveAttribute(
          'aria-label',
          new RegExp(item.label, 'i'),
        );
      }

      // Rodapé: role a página até o final para hidratar.
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      const footer = page.locator('footer').last();
      await expect(footer, 'Rodapé deve existir').toHaveCount(1);

      for (const social of FOOTER_SOCIALS) {
        const link = footer.getByRole('link', { name: new RegExp(social.label, 'i') });
        await expect(link, `Rodapé · ${social.label} deve estar visível`).toBeVisible();
        const svgs = await link.locator('svg').count();
        expect(svgs, `Rodapé · ${social.label} deve conter <svg>`).toBeGreaterThan(0);
      }
    });
  }
});

test.describe('mobile · Regressão visual do rodapé e da bottom nav', () => {
  test.use({
    ...devices['iPhone 12'],
    trace: 'on',
    screenshot: 'on',
    video: 'retain-on-failure',
  });
  test.describe.configure({ retries: process.env.CI ? 4 : 1 });

  // Rotas onde o usuário reportou que ícones somem/desbotam após updates.
  const VISUAL_ROUTES = ['/formacao', '/biblioteca', '/nexus'] as const;

  for (const route of VISUAL_ROUTES) {
    test(`snapshot bottom nav + rodapé em ${route}`, async ({ page }, testInfo) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400); // deixa animações da bottom nav assentarem

      const nav = page.locator('nav[aria-label*="Navegação"]').last();
      await expect(nav).toBeVisible();
      await expect(nav).toHaveScreenshot(`bottom-nav-${route.replace(/\//g, '_') || 'root'}.png`, {
        maxDiffPixelRatio: 0.02,
        animations: 'disabled',
      });

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);
      const footer = page.locator('footer').last();
      await expect(footer).toBeVisible();
      await expect(footer).toHaveScreenshot(`footer-${route.replace(/\//g, '_') || 'root'}.png`, {
        maxDiffPixelRatio: 0.02,
        animations: 'disabled',
      });

      testInfo.annotations.push({
        type: 'visual-regression',
        description: `Rodapé + bottom nav de ${route}`,
      });
    });
  }
});
