import { test, expect, Page } from '@playwright/test';

/**
 * Foco visível de alto contraste no menu do Átrio
 * (hover, focus, active) em tema claro e escuro.
 */

const BLOCKS = [/Estudar/i, /Rezar/i, /Formar[- ]?se/i, /Pesquisar/i, /Minha Jornada/i];

async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript((t) => {
    try { localStorage.setItem('theme', t); } catch {}
    try { localStorage.setItem('vite-ui-theme', t); } catch {}
  }, theme);
  await page.emulateMedia({ colorScheme: theme });
}

async function hasVisibleFocus(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return { visible: false };
    const s = getComputedStyle(el);
    const outlineOn = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0;
    const ringOn = s.boxShadow && s.boxShadow !== 'none';
    return { visible: outlineOn || !!ringOn, outline: s.outline, boxShadow: s.boxShadow };
  });
}

for (const theme of ['light', 'dark'] as const) {
  test.describe(`Átrio · foco visível · tema ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await setTheme(page, theme);
    });

    for (const label of BLOCKS) {
      test(`bloco ${String(label)} exibe foco visível`, async ({ page }) => {
        await page.goto('/');
        const link = page.getByRole('link', { name: label }).first();
        await expect(link).toBeVisible({ timeout: 10_000 });
        await link.focus();
        await expect(link).toBeFocused();
        const focus = await hasVisibleFocus(page);
        expect(focus.visible).toBe(true);
      });
    }

    test('hover altera background do bloco', async ({ page }) => {
      await page.goto('/');
      const link = page.getByRole('link', { name: BLOCKS[0] }).first();
      await expect(link).toBeVisible();
      const before = await link.evaluate((el) => getComputedStyle(el).backgroundColor);
      await link.hover();
      // aguarda transição
      await page.waitForTimeout(600);
      const after = await link.evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(after).not.toBe(before);
    });
  });
}
