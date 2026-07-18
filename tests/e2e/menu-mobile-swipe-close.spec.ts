import { test, expect } from '@playwright/test';

/**
 * Menu mobile · fechar via gesto de swipe/drag (framer-motion `drag="x"`).
 * Threshold configurado na Sidebar: offset.x < -100 OU velocity.x < -500.
 * Após fechar, o foco deve retornar EXATAMENTE ao menu-trigger.
 */

const VIEWPORTS = [
  { name: 'iPhone SE', width: 320, height: 568, dpr: 2 },
  { name: 'iPhone 13', width: 390, height: 844, dpr: 3 },
] as const;

for (const vp of VIEWPORTS) {
  test.describe(`Swipe close · ${vp.name} (${vp.width}×${vp.height})`, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.dpr,
      hasTouch: true,
      isMobile: true,
    });

    test('swipe para a esquerda fecha o drawer e devolve foco ao menu-trigger', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      const trigger = page.getByTestId('menu-trigger');
      await expect(trigger).toBeVisible({ timeout: 10000 });
      await trigger.focus();
      await trigger.click();

      const dialog = page.getByRole('dialog', { name: /Menu de navegação|navigation_menu/i });
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Aguarda animação de entrada estabilizar antes do gesto.
      await page.waitForTimeout(500);

      const box = await dialog.boundingBox();
      if (!box) throw new Error('dialog sem boundingBox');

      // Ponto inicial no meio do drawer; deslocamento de ~180px para a esquerda
      // ultrapassa o threshold offset.x < -100 do framer-motion.
      const startX = box.x + box.width / 2;
      const startY = box.y + box.height / 2;
      const endX = startX - 180;

      // Framer-motion escuta Pointer Events. page.mouse dispara mouse+pointer
      // events, suficiente mesmo com hasTouch=true.
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      // Vários passos pequenos para gerar velocity > 500px/s.
      const steps = 10;
      for (let i = 1; i <= steps; i++) {
        const x = startX + ((endX - startX) * i) / steps;
        await page.mouse.move(x, startY, { steps: 1 });
      }
      await page.mouse.up();

      await expect(dialog).toBeHidden({ timeout: 5000 });

      // Foco deve voltar exatamente ao menu-trigger.
      const triggerHandle = await trigger.elementHandle();
      const isSameNode = await page.evaluate((el) => el === document.activeElement, triggerHandle);
      expect(isSameNode, `activeElement deve ser o menu-trigger em ${vp.name}`).toBe(true);

      const focusedTestId = await page.evaluate(
        () => (document.activeElement as HTMLElement | null)?.getAttribute('data-testid') ?? null,
      );
      expect(focusedTestId, `data-testid do focado em ${vp.name}`).toBe('menu-trigger');
    });
  });
}
