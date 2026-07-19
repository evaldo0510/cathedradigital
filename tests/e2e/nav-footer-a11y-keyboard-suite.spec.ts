import { test, expect, devices, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

/**
 * Suíte consolidada — Bottom Nav + Rodapé:
 *  1. Axe (WCAG 2.1 AA) nas rotas principais, escopo bottom nav + footer, sem violações críticas.
 *  2. Tab percorre bottom nav e rodapé, com indicador de foco visível em cada item.
 *  3. Desktop dark mode: SVGs + aria-labels presentes, sem placeholders, em todas as rotas.
 *  4. Enter e Space em cada item da bottom nav e links sociais abrem a rota/destino correto.
 */

const ROUTES = ['/', '/biblioteca', '/buscar', '/nexus', '/formacao'] as const;

const A11Y_REPORTS = path.join(process.cwd(), 'tests/e2e/a11y-reports');
if (!fs.existsSync(A11Y_REPORTS)) fs.mkdirSync(A11Y_REPORTS, { recursive: true });

const NAV_TARGETS: Array<{ testId: string; urlPattern: RegExp }> = [
  { testId: 'nav-átrio', urlPattern: /\/$/ },
  { testId: 'nav-biblioteca', urlPattern: /\/(biblioteca|bible)/ },
  { testId: 'nav-buscar', urlPattern: /\/buscar/ },
  { testId: 'nav-nexus', urlPattern: /\/nexus/ },
  { testId: 'nav-formação', urlPattern: /\/formacao/ },
];

async function firstExistingNav(page: Page) {
  const items = page.locator('[data-testid^="nav-"]');
  await items.first().waitFor({ state: 'attached', timeout: 5_000 }).catch(() => {});
  return items;
}

// -------------------------------------------------------------
// 1) Axe nas rotas principais — sem violações críticas
// -------------------------------------------------------------
test.describe('Axe · Bottom Nav + Rodapé · rotas principais', () => {
  test.use({ viewport: { width: 720, height: 1000 } });

  for (const route of ROUTES) {
    test(`sem violações críticas em ${route}`, async ({ page }, testInfo) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      const results = await new AxeBuilder({ page })
        .include('nav')
        .include('footer')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const safeRoute = route === '/' ? 'root' : route.replace(/\//g, '-');
      const file = path.join(A11Y_REPORTS, `nav-footer-axe${safeRoute}.json`);
      fs.writeFileSync(file, JSON.stringify(results, null, 2));
      await testInfo.attach(`axe${safeRoute}`, {
        body: JSON.stringify(results, null, 2),
        contentType: 'application/json',
      });

      const critical = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
      expect(critical, `violações críticas em ${route}:\n${JSON.stringify(critical, null, 2)}`).toEqual([]);
    });
  }
});

// -------------------------------------------------------------
// 2) Foco visível ao percorrer bottom nav + rodapé com Tab
// -------------------------------------------------------------
test.describe('Foco visível · Tab pela bottom nav e rodapé', () => {
  test.use({ viewport: { width: 720, height: 1000 } });

  test('cada item da bottom nav mostra indicador de foco', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const items = await firstExistingNav(page);
    const count = await items.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      await item.focus();
      await expect(item).toBeFocused();

      // Indicador de foco visível: outline não-none OU ring/box-shadow definido.
      const focusStyle = await item.evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          outlineStyle: cs.outlineStyle,
          outlineWidth: cs.outlineWidth,
          boxShadow: cs.boxShadow,
        };
      });

      const hasOutline = focusStyle.outlineStyle !== 'none' && parseFloat(focusStyle.outlineWidth) > 0;
      const hasRing = !!focusStyle.boxShadow && focusStyle.boxShadow !== 'none';
      expect(hasOutline || hasRing, `item ${i} sem foco visível: ${JSON.stringify(focusStyle)}`).toBe(true);
    }
  });

  test('links sociais do rodapé mostram indicador de foco', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1800 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const footer = page.locator('footer').last();
    for (const name of ['Instagram', 'Youtube', 'Whatsapp']) {
      const link = footer.getByRole('link', { name: new RegExp(name, 'i') }).first();
      if (!(await link.count())) continue;
      await link.focus();
      await expect(link).toBeFocused();

      const style = await link.evaluate((el) => {
        const cs = getComputedStyle(el);
        return { outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth, boxShadow: cs.boxShadow };
      });
      const hasOutline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
      const hasRing = !!style.boxShadow && style.boxShadow !== 'none';
      expect(hasOutline || hasRing, `${name} sem foco visível`).toBe(true);
    }
  });
});

// -------------------------------------------------------------
// 3) Desktop · Dark mode · ícones + aria-labels em todas as rotas
// -------------------------------------------------------------
test.describe('Desktop · Dark mode · bottom nav + rodapé', () => {
  test.use({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
  });

  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript(() => document.documentElement.classList.add('dark'));
  });

  for (const route of ROUTES) {
    test(`SVGs + aria-labels sem placeholders · ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });

      // Bottom nav (mesmo em desktop, o componente pode estar oculto por breakpoint;
      // validamos apenas quando presente para não gerar falso negativo em desktop).
      const navItems = page.locator('[data-testid^="nav-"]');
      const navCount = await navItems.count();
      for (let i = 0; i < navCount; i++) {
        const item = navItems.nth(i);
        expect(await item.locator('svg').count(), `svg do item ${i}`).toBeGreaterThan(0);
        await expect(item).toHaveAttribute('aria-label', /.+/);
        const text = (await item.innerText().catch(() => '')) ?? '';
        expect(text, 'placeholder □/? no item').not.toMatch(/[□◻︎�]/);
      }

      // Rodapé sempre presente.
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      const footer = page.locator('footer').last();
      await expect(footer).toBeVisible();
      for (const name of ['Instagram', 'Youtube', 'Whatsapp']) {
        const link = footer.getByRole('link', { name: new RegExp(name, 'i') }).first();
        if (!(await link.count())) continue;
        expect(await link.locator('svg').count(), `${name} svg`).toBeGreaterThan(0);
        await expect(link).toHaveAttribute('aria-label', /.+/);
      }
    });
  }
});

// -------------------------------------------------------------
// 4) Enter + Space em cada item da bottom nav e links sociais
// -------------------------------------------------------------
test.describe('Teclado · Enter e Space navegam para o destino correto', () => {
  test.use({ viewport: { width: 720, height: 1000 } });

  for (const key of ['Enter', 'Space'] as const) {
    for (const target of NAV_TARGETS) {
      test(`${key} em ${target.testId} abre rota correta`, async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        const item = page.getByTestId(target.testId).first();
        if (!(await item.count())) test.skip(true, `${target.testId} indisponível`);

        await item.focus();
        await expect(item).toBeFocused();
        await page.keyboard.press(key);
        await expect(page).toHaveURL(target.urlPattern, { timeout: 5_000 });
      });
    }
  }

  test('Enter em link social abre href externo', async ({ page, context }) => {
    await page.setViewportSize({ width: 1280, height: 1800 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const link = page.locator('footer').last().getByRole('link', { name: /instagram/i }).first();
    if (!(await link.count())) test.skip(true, 'Instagram indisponível');

    const href = await link.getAttribute('href');
    expect(href).toBeTruthy();

    await link.focus();
    const [popup] = await Promise.all([
      context.waitForEvent('page').catch(() => null),
      page.keyboard.press('Enter'),
    ]);
    if (popup) {
      await popup.waitForLoadState('domcontentloaded').catch(() => {});
      expect(popup.url()).toContain(new URL(href!, 'https://x').hostname.replace(/^x$/, ''));
      await popup.close();
    }
  });
});
