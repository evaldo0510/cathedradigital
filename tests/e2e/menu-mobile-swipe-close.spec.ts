import { test, expect, type Page } from '@playwright/test';

/**
 * Menu mobile · fechar via gesto de swipe/drag (framer-motion `drag="x"`).
 * Threshold configurado na Sidebar: offset.x < -100 OU velocity.x < -500.
 * Após fechar, o foco deve retornar EXATAMENTE ao menu-trigger.
 */

const VIEWPORTS = [
  { name: 'iPhone SE', width: 320, height: 568, dpr: 2 },
  { name: 'iPhone 13', width: 390, height: 844, dpr: 3 },
] as const;

/**
 * Dispara uma sequência Pointer Events completa (down → move* → up) no ponto
 * indicado. Framer-motion escuta Pointer Events, então isso é mais confiável
 * que page.mouse quando hasTouch está ativo.
 */
async function pointerSwipeLeft(
  page: Page,
  startX: number,
  startY: number,
  deltaX: number,
  steps: number,
  stepDelayMs: number,
) {
  await page.evaluate(
    async ({ startX, startY, deltaX, steps, stepDelayMs }) => {
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
        fire('pointermove', x, startY);
        // Aguarda para controlar velocity (px por ms) sem estourar o threshold negativo.
        await new Promise((r) => setTimeout(r, stepDelayMs));
      }
      fire('pointerup', startX + deltaX, startY);
    },
    { startX, startY, deltaX, steps, stepDelayMs },
  );
}

for (const vp of VIEWPORTS) {
  test.describe(`Swipe close · ${vp.name} (${vp.width}×${vp.height})`, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.dpr,
      hasTouch: true,
      isMobile: true,
    });

    test('swipe para a esquerda fecha o drawer e devolve foco ao menu-trigger', async ({ page }) => {
      test.slow(); // triplica o timeout: gesto + animação de saída podem passar de 5s em CI.

      await page.goto('/', { waitUntil: 'domcontentloaded' });

      const trigger = page.getByTestId('menu-trigger');
      await expect(trigger).toBeVisible({ timeout: 10000 });
      await trigger.focus();
      await trigger.click();

      const dialog = page.getByRole('dialog', { name: /Menu de navegação|navigation_menu/i });
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Aguarda animação de entrada estabilizar completamente.
      await page.waitForTimeout(700);

      const box = await dialog.boundingBox();
      if (!box) throw new Error('dialog sem boundingBox');

      const startX = box.x + box.width / 2;
      const startY = box.y + box.height / 2;
      const deltaX = -Math.max(180, Math.floor(box.width * 0.7));

      // Estratégia de retry: até 3 tentativas com passos/velocidade crescentes.
      // Framer-motion pode ignorar gestos pouco convincentes; se o dialog não
      // fechar, retentamos com mais passos e menos delay (maior velocity).
      const attempts = [
        { steps: 20, stepDelayMs: 12 }, // ~240ms total, velocity ~ deltaX/240 * 1000 px/s
        { steps: 24, stepDelayMs: 8 },  // ~192ms
        { steps: 30, stepDelayMs: 5 },  // ~150ms → velocity bem acima de 500 px/s
      ];

      let closed = false;
      for (const attempt of attempts) {
        await pointerSwipeLeft(page, startX, startY, deltaX, attempt.steps, attempt.stepDelayMs);
        try {
          await expect(dialog).toBeHidden({ timeout: 3000 });
          closed = true;
          break;
        } catch {
          // Ainda visível: aguarda snap-back terminar antes de retentar.
          await page.waitForTimeout(500);
        }
      }
      expect(closed, `drawer não fechou após ${attempts.length} tentativas de swipe em ${vp.name}`).toBe(true);

      // Foco deve voltar exatamente ao menu-trigger.
      const triggerHandle = await trigger.elementHandle();
      const isSameNode = await page.evaluate((el) => el === document.activeElement, triggerHandle);
      expect(isSameNode, `activeElement deve ser o menu-trigger em ${vp.name}`).toBe(true);

      const focusedTestId = await page.evaluate(
        () => (document.activeElement as HTMLElement | null)?.getAttribute('data-testid') ?? null,
      );
      expect(focusedTestId, `data-testid do focado em ${vp.name}`).toBe('menu-trigger');
    });

    test('swipe abaixo do threshold NÃO fecha o drawer nem move o foco', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      const trigger = page.getByTestId('menu-trigger');
      await expect(trigger).toBeVisible({ timeout: 10000 });
      await trigger.focus();
      await trigger.click();

      const dialog = page.getByRole('dialog', { name: /Menu de navegação|navigation_menu/i });
      await expect(dialog).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(700);

      // Foco inicial dentro do dialog (padrão Radix: botão Fechar).
      const focusedBefore = await dialog.evaluate((el) => el.contains(document.activeElement));
      expect(focusedBefore, `foco inicial deve estar dentro do dialog em ${vp.name}`).toBe(true);

      const box = await dialog.boundingBox();
      if (!box) throw new Error('dialog sem boundingBox');

      const startX = box.x + box.width / 2;
      const startY = box.y + box.height / 2;

      // Gesto propositalmente fraco: offset ≈ -60px (< 100) E velocity baixa
      // (~150 px/s, muito abaixo de 500). Deve fazer snap-back sem fechar.
      await pointerSwipeLeft(page, startX, startY, -60, 20, 20); // ~400ms total

      // Pequena janela para eventual (indesejado) fechamento se manifestar.
      await page.waitForTimeout(600);

      // Contrato: dialog permanece visível.
      await expect(dialog).toBeVisible();

      // Foco continua dentro do dialog — trigger não recebeu foco de volta.
      const focusedAfter = await dialog.evaluate((el) => el.contains(document.activeElement));
      expect(focusedAfter, `foco não pode escapar do dialog em ${vp.name}`).toBe(true);

      const focusedTestId = await page.evaluate(
        () => (document.activeElement as HTMLElement | null)?.getAttribute('data-testid') ?? null,
      );
      expect(focusedTestId, `foco não pode retornar ao menu-trigger em ${vp.name}`).not.toBe('menu-trigger');
    });

    test('múltiplos swipes abaixo do threshold NÃO fecham o drawer', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      const trigger = page.getByTestId('menu-trigger');
      await expect(trigger).toBeVisible({ timeout: 10000 });
      await trigger.focus();
      await trigger.click();

      const dialog = page.getByRole('dialog', { name: /Menu de navegação|navigation_menu/i });
      await expect(dialog).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(700);

      const box = await dialog.boundingBox();
      if (!box) throw new Error('dialog sem boundingBox');
      const startX = box.x + box.width / 2;
      const startY = box.y + box.height / 2;

      // 5 gestos fracos consecutivos, variando levemente offset (-40 a -80) e
      // duração (mantendo velocity < 500 px/s). Cada gesto deve gerar snap-back
      // sem acumular estado que force o fechamento.
      const gestures = [
        { dx: -40, steps: 15 },
        { dx: -70, steps: 22 },
        { dx: -55, steps: 18 },
        { dx: -80, steps: 25 },
        { dx: -50, steps: 16 },
      ];

      for (const [i, g] of gestures.entries()) {
        await pointerSwipeLeft(page, startX, startY, g.dx, g.steps, 20);
        await page.waitForTimeout(350); // deixa framer-motion animar snap-back
        await expect(dialog, `dialog deve seguir visível após swipe #${i + 1} em ${vp.name}`).toBeVisible();
      }

      await page.waitForTimeout(400);
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
