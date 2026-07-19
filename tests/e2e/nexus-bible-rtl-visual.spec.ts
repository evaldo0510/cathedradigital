/**
 * Regressão E2E + visual para a bolha Nexus exibindo referências bíblicas
 * em RTL (light e dark), após a correção do formatNexusContent que passou
 * a derivar book/chapter/verse do reference_id.
 */
import { test, expect } from '@playwright/test';
import { openNexus } from './_helpers/nexus';

const MODES: Array<{ name: 'light' | 'dark' }> = [{ name: 'light' }, { name: 'dark' }];

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');
  });
});

for (const mode of MODES) {
  test(`Nexus bible bubble em RTL (${mode.name}) exibe referência + link e bate snapshot`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: mode.name });
    if (mode.name === 'dark') {
      await page.addInitScript(() => {
        document.documentElement.classList.add('dark');
      });
    }

    const dialog = await openNexus(page);

    // Confirma dir=rtl efetivo no root.
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    // Espera itens bíblicos aparecerem via formatNexusContent enriquecido.
    const bibleItem = dialog.locator('[data-nexus-type="bible"]').first();
    await expect(bibleItem).toBeVisible({ timeout: 15_000 });

    // Link para /bible?book=...&ch=...&verse=... precisa estar ancorado.
    const bibleLink = dialog.locator('a[href^="/bible?book="]').first();
    await expect(bibleLink).toBeVisible();
    const href = await bibleLink.getAttribute('href');
    expect(href).toMatch(/\/bible\?book=[^&]+&ch=\d+/);

    // Desativa animações para snapshot determinístico.
    await page.addStyleTag({
      content: `*, *::before, *::after {
        transition: none !important;
        animation: none !important;
        caret-color: transparent !important;
      }`,
    });
    await page.waitForTimeout(200);

    await expect(dialog).toHaveScreenshot(`nexus-bible-rtl-${mode.name}.png`, {
      maxDiffPixelRatio: 0.03,
      animations: 'disabled',
    });
  });
}
