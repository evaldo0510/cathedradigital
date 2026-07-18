import { test, expect } from '@playwright/test';

/**
 * Menu mobile · fechar via overlay em múltiplos viewports iPhone.
 * - Clicar fora do drawer (região do backdrop) fecha a Sidebar.
 * - Foco deve retornar EXATAMENTE ao botão que abriu (menu-trigger).
 */

const VIEWPORTS = [
  { name: 'iPhone SE', width: 320, height: 568, dpr: 2 },
  { name: 'iPhone 13', width: 390, height: 844, dpr: 3 },
] as const;

for (const vp of VIEWPORTS) {
  test.describe(`Overlay · ${vp.name} (${vp.width}×${vp.height})`, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.dpr,
      hasTouch: true,
      isMobile: true,
    });

    test('clicar fora do drawer fecha e devolve foco ao menu-trigger', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      const trigger = page.getByTestId('menu-trigger');
      await expect(trigger).toBeVisible({ timeout: 10000 });
      await trigger.focus();
      await trigger.click();

      const dialog = page.getByRole('dialog', { name: /Menu de navegação|navigation_menu/i });
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Aguarda animação de entrada estabilizar antes de tocar no overlay.
      await page.waitForTimeout(400);

      // Sidebar tem largura w-[min(280px,85vw)]. Calcula ponto seguro fora do drawer,
      // dentro do viewport e acima do BottomNav (que fica nos ~80px inferiores).
      const drawerWidth = Math.min(280, Math.floor(vp.width * 0.85));
      const clickX = Math.min(vp.width - 10, drawerWidth + Math.floor((vp.width - drawerWidth) / 2));
      const clickY = Math.floor(vp.height / 2);

      // Tap para respeitar hasTouch nos viewports mobile.
      await page.touchscreen.tap(clickX, clickY);

      await expect(dialog).toBeHidden({ timeout: 5000 });

      // Foco deve voltar exatamente ao menu-trigger.
      // 1) Identidade do nó.
      const triggerHandle = await trigger.elementHandle();
      const isFocused = await page.evaluate((el) => el === document.activeElement, triggerHandle);
      expect(isFocused, `menu-trigger deve receber foco em ${vp.name} após clicar no overlay`).toBe(true);

      // 2) Verificação semântica: data-testid do elemento focado.
      const focusedTestId = await page.evaluate(
        () => (document.activeElement as HTMLElement | null)?.getAttribute('data-testid') ?? null,
      );
      expect(focusedTestId, `data-testid do elemento focado em ${vp.name}`).toBe('menu-trigger');
    });

    test('ESC com drawer já fechado não altera activeElement', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      const trigger = page.getByTestId('menu-trigger');
      await expect(trigger).toBeVisible({ timeout: 10000 });
      await trigger.focus();

      // Confirma estado inicial: drawer fechado, foco no trigger.
      const dialog = page.getByRole('dialog', { name: /Menu de navegação|navigation_menu/i });
      await expect(dialog).toBeHidden();

      const triggerHandle = await trigger.elementHandle();
      const focusedBefore = await page.evaluate((el) => el === document.activeElement, triggerHandle);
      expect(focusedBefore, `foco inicial deve estar no menu-trigger em ${vp.name}`).toBe(true);

      // Pressiona ESC sem drawer aberto.
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);

      // activeElement deve permanecer no menu-trigger.
      const focusedAfter = await page.evaluate((el) => el === document.activeElement, triggerHandle);
      expect(focusedAfter, `ESC no vazio não pode roubar foco em ${vp.name}`).toBe(true);

      const focusedTestId = await page.evaluate(
        () => (document.activeElement as HTMLElement | null)?.getAttribute('data-testid') ?? null,
      );
      expect(focusedTestId).toBe('menu-trigger');
    });
  });
}
