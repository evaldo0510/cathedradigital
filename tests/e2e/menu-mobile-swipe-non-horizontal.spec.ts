import { test, expect, type Page } from '@playwright/test';

/**
 * Menu mobile · swipes NÃO horizontais (vertical e diagonal abaixo do limiar).
 *
 * A Sidebar usa framer-motion `drag="x"`, com fechamento quando
 * offset.x < -100 OU velocity.x < -500. Um swipe puramente vertical não gera
 * dragX significativo; um diagonal com deltaX pequeno também não deve fechar.
 * Em ambos os casos: drawer segue aberto e foco permanece dentro dele.
 */

const VIEWPORTS = [
  { name: 'iPhone SE', width: 320, height: 568, dpr: 2 },
  { name: 'iPhone 13', width: 390, height: 844, dpr: 3 },
] as const;

async function pointerSwipe(
  page: Page,
  startX: number,
  startY: number,
  deltaX: number,
  deltaY: number,
  steps: number,
  stepDelayMs: number,
) {
  await page.evaluate(
    async ({ startX, startY, deltaX, deltaY, steps, stepDelayMs }) => {
      const target = document.elementFromPoint(startX, startY) ?? document.body;
      const pointerId = 1;
      const base = {
        pointerId,
        pointerType: 'touch' as const,
        isPrimary: true,
        bubbles: true,
        cancelable: true,
        composed: true,
      };
      const fire = (type: string, x: number, y: number) => {
        const ev = new PointerEvent(type, { ...base, clientX: x, clientY: y });
        target.dispatchEvent(ev);
      };
      fire('pointerdown', startX, startY);
      for (let i = 1; i <= steps; i++) {
        const x = startX + (deltaX * i) / steps;
        const y = startY + (deltaY * i) / steps;
        fire('pointermove', x, y);
        await new Promise((r) => setTimeout(r, stepDelayMs));
      }
      fire('pointerup', startX + deltaX, startY + deltaY);
    },
    { startX, startY, deltaX, deltaY, steps, stepDelayMs },
  );
}

async function openDrawer(page: Page) {
  const trigger = page.getByTestId('menu-trigger');
  await expect(trigger).toBeVisible({ timeout: 10000 });
  await trigger.focus();
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: /Menu de navegação|navigation_menu/i });
  await expect(dialog).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(700);
  return dialog;
}

for (const vp of VIEWPORTS) {
  test.describe(`Swipe não-horizontal · ${vp.name} (${vp.width}×${vp.height})`, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
      hasTouch: true,
      deviceScaleFactor: vp.dpr,
      isMobile: true,
    });

    test('swipe puramente vertical NÃO fecha o drawer nem move o foco', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const dialog = await openDrawer(page);

      const box = await dialog.boundingBox();
      if (!box) throw new Error('dialog sem boundingBox');
      const startX = box.x + box.width / 2;
      const startY = box.y + box.height / 3;

      // Swipe vertical puro: deltaX = 0, deltaY = -200 (para cima), lento.
      await pointerSwipe(page, startX, startY, 0, -200, 20, 20);
      await page.waitForTimeout(500);

      await expect(dialog, `dialog deve seguir visível em ${vp.name}`).toBeVisible();

      const focusedInside = await dialog.evaluate((el) => el.contains(document.activeElement));
      expect(focusedInside, `foco não pode escapar do dialog em ${vp.name}`).toBe(true);

      const focusedTestId = await page.evaluate(
        () => (document.activeElement as HTMLElement | null)?.getAttribute('data-testid') ?? null,
      );
      expect(focusedTestId, `foco não pode retornar ao menu-trigger em ${vp.name}`).not.toBe('menu-trigger');
    });

    test('swipe diagonal abaixo do limiar (deltaX pequeno) NÃO fecha o drawer', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const dialog = await openDrawer(page);

      const box = await dialog.boundingBox();
      if (!box) throw new Error('dialog sem boundingBox');
      const startX = box.x + box.width / 2;
      const startY = box.y + box.height / 2;

      // Diagonal: deltaX = -60 (abaixo de -100), deltaY = -160, velocity baixa.
      await pointerSwipe(page, startX, startY, -60, -160, 22, 20);
      await page.waitForTimeout(500);

      await expect(dialog).toBeVisible();

      const focusedInside = await dialog.evaluate((el) => el.contains(document.activeElement));
      expect(focusedInside, `foco não pode escapar do dialog em ${vp.name}`).toBe(true);

      const focusedTestId = await page.evaluate(
        () => (document.activeElement as HTMLElement | null)?.getAttribute('data-testid') ?? null,
      );
      expect(focusedTestId, `foco não pode retornar ao menu-trigger em ${vp.name}`).not.toBe('menu-trigger');
    });
  });
}
