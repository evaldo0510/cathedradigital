/**
 * Regressão de layout da bolha Nexus em três larguras (mobile/tablet/desktop),
 * light e dark. Garante que:
 *  - o painel abre sem quebrar layout,
 *  - itens bíblicos renderizam,
 *  - nenhum "undefined"/"NaN" vaza no texto ou nos hrefs,
 *  - snapshot bate por viewport+modo.
 */
import { test, expect, devices } from '@playwright/test';
import { openNexus } from './_helpers/nexus';

const VIEWPORTS = [
  { key: 'mobile', width: 390, height: 844 },
  { key: 'tablet', width: 820, height: 1180 },
  { key: 'desktop', width: 1440, height: 900 },
] as const;

const MODES = ['light', 'dark'] as const;

for (const vp of VIEWPORTS) {
  for (const mode of MODES) {
    test(`Nexus bible bubble — ${vp.key} ${mode} sem quebra de conteúdo`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.emulateMedia({ colorScheme: mode });
      if (mode === 'dark') {
        await page.addInitScript(() => document.documentElement.classList.add('dark'));
      }

      const dialog = await openNexus(page);

      const bibleItem = dialog.locator('[data-nexus-type="bible"]').first();
      await expect(bibleItem).toBeVisible({ timeout: 15_000 });

      const bibleLink = dialog.locator('a[href^="/bible?book="]').first();
      await expect(bibleLink).toBeVisible();
      const href = await bibleLink.getAttribute('href');
      expect(href).toMatch(/\/bible\?book=[^&]+&ch=\d+(&verse=\d+)?$/);
      expect(href).not.toMatch(/undefined|NaN|null/i);

      // Nenhum texto visível deve conter tokens de vazamento.
      const panelText = (await dialog.innerText()) ?? '';
      expect(panelText).not.toMatch(/\bundefined\b/);
      expect(panelText).not.toMatch(/\bNaN\b/);

      // Overflow horizontal do painel — layout não pode quebrar.
      const overflowsX = await dialog.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
      expect(overflowsX).toBe(false);

      await page.addStyleTag({
        content: `*, *::before, *::after { transition: none !important; animation: none !important; }`,
      });
      await page.waitForTimeout(150);

      await expect(dialog).toHaveScreenshot(`nexus-bible-${vp.key}-${mode}.png`, {
        maxDiffPixelRatio: 0.04,
        animations: 'disabled',
      });
    });
  }
}
