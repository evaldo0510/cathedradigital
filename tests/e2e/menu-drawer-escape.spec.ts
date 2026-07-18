import { test, expect } from '@playwright/test';

/**
 * Drawer/Sidebar · ESC fecha e devolve o foco ao trigger.
 *
 * Complementa `menu-mobile-a11y.spec.ts` (que cobre iPhone SE) validando
 * o mesmo contrato no viewport desktop (1280×800). Requisito WAI-ARIA
 * APG para dialog: ao fechar, o foco retorna ao elemento que abriu.
 */

test.describe('Drawer · ESC fecha e retorna foco (desktop)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('foco volta exatamente ao menu-trigger após ESC', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    const trigger = page.getByTestId('menu-trigger');
    await expect(trigger, 'menu-trigger deve estar visível').toBeVisible({ timeout: 5000 });

    await trigger.click();

    const dialog = page.getByRole('dialog', { name: /Menu de navegação|navigation_menu/i });
    await expect(dialog, 'dialog deve abrir').toBeVisible({ timeout: 5000 });

    // Foco inicial deve estar dentro do dialog (contrato APG).
    const initialInside = await dialog.evaluate((el) => el.contains(document.activeElement));
    expect(initialInside, 'foco inicial deve estar dentro do dialog').toBe(true);

    await page.keyboard.press('Escape');
    await expect(dialog, 'dialog deve fechar após ESC').toBeHidden({ timeout: 5000 });

    // Foco deve retornar EXATAMENTE ao trigger (não apenas para <body>).
    const triggerHandle = await trigger.elementHandle();
    const isFocused = await page.evaluate((el) => el === document.activeElement, triggerHandle);
    expect(isFocused, 'menu-trigger deve receber foco após ESC').toBe(true);

    // Segurança extra: nenhum outro elemento roubou o foco antes do trigger.
    const activeTestId = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.getAttribute('data-testid') ?? null,
    );
    expect(activeTestId).toBe('menu-trigger');
  });

  test('ESC não fecha nada quando dialog não está aberto (no-op)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const before = page.url();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    expect(page.url(), 'URL não deve mudar com ESC fora de dialog').toBe(before);
  });
});
