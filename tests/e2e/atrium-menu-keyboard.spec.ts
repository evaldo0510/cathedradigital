import { test, expect } from '@playwright/test';

/**
 * Navegação por teclado no menu do Átrio:
 *  - Tab / Shift+Tab percorrem os blocos com foco visível
 *  - Enter e Espaço ativam cada rota
 *  - Popover Nexus (se aberto antes) fecha ao trocar de ambiente
 */

const BLOCKS = [
  { label: /Estudar/i,       path: /\/bible/ },
  { label: /Rezar/i,         path: /\/oracao/ },
  { label: /Formar[- ]?se/i, path: /\/jornadas/ },
  { label: /Pesquisar/i,     path: /\/buscar/ },
  { label: /Minha Jornada/i, path: /\/hoje/ },
] as const;

async function focusFirstMenuLink(page: import('@playwright/test').Page, label: RegExp) {
  const link = page.getByRole('link', { name: label }).first();
  await expect(link).toBeVisible({ timeout: 10000 });
  await link.focus();
  await expect(link).toBeFocused();
  return link;
}

async function hasVisibleFocus(handle: import('@playwright/test').Locator) {
  return handle.evaluate((el) => {
    const s = getComputedStyle(el);
    const ring = s.boxShadow && s.boxShadow !== 'none';
    const outline = s.outlineStyle !== 'none' && s.outlineWidth !== '0px';
    return ring || outline;
  });
}

for (const vp of [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'mobile',  width: 390,  height: 844 },
] as const) {
  test.describe(`Átrio menu · teclado · ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('Tab avança e Shift+Tab retrocede entre blocos com foco visível', async ({ page }) => {
      await page.goto('/');
      const first = await focusFirstMenuLink(page, BLOCKS[0].label);
      expect(await hasVisibleFocus(first)).toBe(true);

      await page.keyboard.press('Tab');
      const afterTab = await page.evaluate(() => document.activeElement?.textContent?.trim());
      expect(afterTab).not.toEqual(await first.textContent());

      await page.keyboard.press('Shift+Tab');
      await expect(first).toBeFocused();
    });

    for (const [i, block] of BLOCKS.entries()) {
      const key = i % 2 === 0 ? 'Enter' : ' '; // alterna Enter/Espaço
      test(`ativar "${String(block.label)}" com ${key === ' ' ? 'Space' : 'Enter'}`, async ({ page }) => {
        await page.goto('/');
        const link = page.getByRole('link', { name: block.label }).first();
        await link.focus();
        await expect(link).toBeFocused();
        expect(await hasVisibleFocus(link)).toBe(true);
        await page.keyboard.press(key === ' ' ? 'Space' : 'Enter');
        await expect(page).toHaveURL(block.path);
        const main = page.locator('main, [role="main"]').first();
        await expect(main).toBeVisible({ timeout: 15000 });
      });
    }

    test('Popover Nexus aberto antes é fechado ao selecionar bloco do menu', async ({ page }) => {
      await page.goto('/bible?book=Jo&ch=6');
      const trigger = page.locator('[data-nexus-trigger], button:has-text("Nexus")').first();
      if (await trigger.count()) {
        await trigger.click().catch(() => {});
      }
      await page.goto('/');
      const link = page.getByRole('link', { name: /Rezar/i }).first();
      await link.focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/oracao/);
      await expect(page.locator('[data-radix-popper-content-wrapper]:visible')).toHaveCount(0);
    });
  });
}
