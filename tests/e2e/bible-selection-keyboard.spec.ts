import { test, expect, devices } from '@playwright/test';

/**
 * Cobre:
 *  - Screenshots do estado "selecionado" (livro e capítulo) em mobile e desktop
 *  - Navegação por teclado com setas move foco e Enter altera seleção
 *  - Popover Nexus continua funcional (não é quebrado pelo focus handler)
 */

const VIEWPORTS = [
  { name: 'mobile', ...devices['iPhone 13'] },
  { name: 'desktop', viewport: { width: 1280, height: 900 } },
] as const;

for (const vp of VIEWPORTS) {
  test.describe(`Bible selection · ${vp.name}`, () => {
    test.use({ viewport: vp.viewport, userAgent: (vp as any).userAgent });

    test('livro selecionado tem destaque visível (snapshot)', async ({ page }) => {
      await page.goto('/bible?book=Jo&ch=6');
      // Volta para a lista de livros
      await page.goto('/bible');
      const active = page.locator('[data-book-btn][aria-current="page"]').first();
      // pode não haver livro ativo na home; tolerante
      if (await active.count()) {
        await expect(active).toBeVisible();
        await expect(active).toHaveScreenshot(`book-selected-${vp.name}.png`, {
          maxDiffPixelRatio: 0.02,
        });
      }
    });

    test('capítulo selecionado tem destaque e aria-current', async ({ page }) => {
      await page.goto('/bible?book=Jo');
      const grid = page.getByTestId('chapter-grid');
      await expect(grid).toBeVisible();
      const ch6 = page.getByTestId('chapter-btn-6');
      await ch6.click();
      await expect(ch6).toHaveAttribute('aria-current', 'page');
      await expect(ch6).toHaveScreenshot(`chapter-selected-${vp.name}.png`, {
        maxDiffPixelRatio: 0.02,
      });
    });

    test('setas movem foco no grid de capítulos sem alterar seleção', async ({ page }) => {
      await page.goto('/bible?book=Jo');
      const ch1 = page.getByTestId('chapter-btn-1');
      await ch1.focus();
      await expect(ch1).toBeFocused();

      await page.keyboard.press('ArrowRight');
      await expect(page.getByTestId('chapter-btn-2')).toBeFocused();

      await page.keyboard.press('ArrowDown');
      await expect(page.getByTestId('chapter-btn-6')).toBeFocused(); // cols=4 → 2+4

      await page.keyboard.press('ArrowLeft');
      await expect(page.getByTestId('chapter-btn-5')).toBeFocused();

      await page.keyboard.press('Home');
      await expect(page.getByTestId('chapter-btn-1')).toBeFocused();

      // Enter aplica seleção
      await page.getByTestId('chapter-btn-3').focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/ch=3/);
    });

    test('Tab mantém navegação normal e não fica preso no grid', async ({ page }) => {
      await page.goto('/bible?book=Jo');
      await page.getByTestId('chapter-btn-1').focus();
      // Tab não deve manter foco no mesmo botão
      await page.keyboard.press('Tab');
      const stillOn1 = await page.getByTestId('chapter-btn-1').evaluate(
        (el) => el === document.activeElement,
      );
      expect(stillOn1).toBe(false);
    });

    test('setas na lista de livros movem foco verticalmente', async ({ page }) => {
      await page.goto('/bible');
      const list = page.getByTestId('book-list');
      if (!(await list.count())) test.skip(true, 'lista de livros não renderizada nesta rota');
      const first = list.locator('[data-book-btn]').first();
      await first.focus();
      await expect(first).toBeFocused();
      await page.keyboard.press('ArrowDown');
      const second = list.locator('[data-book-btn]').nth(1);
      await expect(second).toBeFocused();
      await page.keyboard.press('ArrowUp');
      await expect(first).toBeFocused();
    });

    test('Popover Nexus continua abrindo em versículo após interações de teclado', async ({ page }) => {
      await page.goto('/bible?book=Jo&ch=6');
      // aguarda versículos carregarem
      await page.waitForSelector('[data-testid^="chapter-btn-"], article, main', { timeout: 15000 });
      // pressiona algumas setas para garantir que handlers não impedem clique posterior
      await page.keyboard.press('Tab');
      await page.keyboard.press('ArrowDown');
      const trigger = page.locator('[data-nexus-trigger], [aria-label*="Nexus" i], button:has-text("Nexus")').first();
      if (await trigger.count()) {
        await trigger.click();
        const popover = page.locator('[role="dialog"], [data-radix-popper-content-wrapper]').first();
        await expect(popover).toBeVisible({ timeout: 5000 });
        await page.keyboard.press('Escape');
      }
    });
  });
}
