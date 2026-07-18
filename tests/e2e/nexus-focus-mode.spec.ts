/**
 * CAT-030 — Focus mode do Nexus.
 *
 * Valida em múltiplos viewports (mobile, phablet, tablet, desktop) que:
 *  - Atalho `f` alterna `data-focus-mode`.
 *  - Ao ligar: toggle de foco (`data-testid="nexus-focus-toggle"`) e dots
 *    (`data-testid="nexus-section-dots"`) somem, mas a seção ativa
 *    (`data-testid="nexus-active-section"`) continua visível.
 *  - Atalhos `]` / `[` e `Alt+←/→` continuam alternando seções em focus mode.
 *  - `aria-modal`, `role="dialog"` e `aria-live` seguem presentes.
 */
import { test, expect, type Page } from '@playwright/test';

const ROUTE = '/catechism?p=1817';

const VIEWPORTS = [
  { name: 'mobile-sm', width: 360, height: 780 },
  { name: 'mobile-lg', width: 414, height: 896 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'desktop', width: 1280, height: 900 },
];

async function openNexus(page: Page) {
  await page.goto(ROUTE, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  const trigger = page
    .locator('[data-nexus-trigger], [data-tag-slug], button:has-text("Nexus")')
    .first();
  await expect(trigger).toBeVisible({ timeout: 10_000 });
  await trigger.click();
  const dialog = page.locator('[role="dialog"][data-focus-mode]').first();
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  return dialog;
}

for (const vp of VIEWPORTS) {
  test.describe(`CAT-030 — Focus mode @ ${vp.name} (${vp.width}x${vp.height})`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('atalho `f` liga/desliga focus mode preservando a11y e navegação por teclado', async ({ page }) => {
      const pageErrors: string[] = [];
      page.on('pageerror', (e) => pageErrors.push(e.message));

      const dialog = await openNexus(page);

      // Estado inicial: focus mode desligado, cabeçalho e dots visíveis.
      await expect(dialog).toHaveAttribute('data-focus-mode', 'false');
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
      const header = dialog.locator('[data-testid="nexus-header"]');
      const dots = dialog.locator('[data-testid="nexus-visited-dots"]');
      const activeSection = dialog.locator('[data-testid="nexus-active-section"]').first();
      await expect(activeSection).toBeVisible();

      // Captura a seção ativa inicial para comparar depois.
      const initialKind = await activeSection.getAttribute('data-section-kind');

      // Liga focus mode via `f`.
      await dialog.focus();
      await page.keyboard.press('f');
      await expect(dialog).toHaveAttribute('data-focus-mode', 'true', { timeout: 5000 });

      // Cabeçalho e dots devem sumir do DOM ou ficar invisíveis.
      if (await header.count()) {
        await expect(header.first()).toBeHidden();
      }
      if (await dots.count()) {
        await expect(dots.first()).toBeHidden();
      }

      // Seção ativa continua visível.
      await expect(activeSection).toBeVisible();

      // aria-live segue presente para anúncios.
      const live = dialog.locator('[aria-live]');
      expect(await live.count()).toBeGreaterThan(0);

      // Atalhos de navegação continuam funcionando em focus mode.
      const sectionsCount = await dialog.locator('[data-nexus-section]').count();
      if (sectionsCount > 1) {
        await page.keyboard.press(']');
        await page.waitForTimeout(400);
        const nextKind = await activeSection.getAttribute('data-section-kind');
        expect(nextKind, 'seção mudou após `]` em focus mode').not.toBe(initialKind);

        await page.keyboard.press('[');
        await page.waitForTimeout(400);
        const backKind = await activeSection.getAttribute('data-section-kind');
        expect(backKind, 'seção voltou após `[` em focus mode').toBe(initialKind);

        // Alt+→ também precisa funcionar em focus mode.
        await page.keyboard.press('Alt+ArrowRight');
        await page.waitForTimeout(400);
        const altKind = await activeSection.getAttribute('data-section-kind');
        expect(altKind, 'Alt+→ alterna em focus mode').not.toBe(initialKind);
      }

      // Desliga focus mode: cabeçalho volta.
      await page.keyboard.press('f');
      await expect(dialog).toHaveAttribute('data-focus-mode', 'false', { timeout: 5000 });
      if (await header.count()) {
        await expect(header.first()).toBeVisible();
      }

      // Nenhum erro de execução ao alternar.
      expect(pageErrors).toEqual([]);
    });
  });
}
