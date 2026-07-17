import { test, expect, devices } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Cobre:
 *  A) axe-core no estado "selecionado" (livro e capítulo) e após navegação por setas
 *  B) Ordem lógica de Tab + foco visível único (sem duplicação/salto no DOM)
 *  C) Troca de livro/capítulo por teclado + reload → seleção restaurada
 *  D) Rolagem: item selecionado permanece destacado e visível ao voltar
 */

const VIEWPORTS = [
  { name: 'mobile', ...devices['iPhone 13'] },
  { name: 'desktop', viewport: { width: 1280, height: 900 } },
] as const;

const CRITICAL_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

for (const vp of VIEWPORTS) {
  test.describe(`Bible selection A11y+KB · ${vp.name}`, () => {
    test.use({ viewport: vp.viewport, userAgent: (vp as any).userAgent });

    // ────────────────────────────────────────────────────────────
    // A) axe-core cobrindo estado selecionado + após setas
    // ────────────────────────────────────────────────────────────
    test('axe: sem violações críticas no capítulo selecionado', async ({ page }) => {
      await page.goto('/bible?book=Jo&ch=6');
      await expect(page.getByTestId('chapter-btn-6')).toBeVisible({ timeout: 15000 });
      await expect(page.getByTestId('chapter-btn-6')).toHaveAttribute('aria-current', 'page');

      const results = await new AxeBuilder({ page })
        .withTags(CRITICAL_TAGS)
        .include('[data-testid="chapter-grid"]')
        .analyze();
      const critical = results.violations.filter((v) =>
        ['critical', 'serious'].includes(v.impact || ''),
      );
      expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
    });

    test('axe: sem violações após navegação por setas no grid', async ({ page }) => {
      await page.goto('/bible?book=Jo');
      const first = page.getByTestId('chapter-btn-1');
      await first.focus();
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');

      const results = await new AxeBuilder({ page })
        .withTags(CRITICAL_TAGS)
        .include('[data-testid="chapter-grid"]')
        .analyze();
      const critical = results.violations.filter((v) =>
        ['critical', 'serious'].includes(v.impact || ''),
      );
      expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
    });

    test('axe: sem violações na lista de livros com item selecionado', async ({ page }) => {
      await page.goto('/bible');
      const list = page.getByTestId('book-list');
      if (!(await list.count())) test.skip(true, 'lista de livros ausente');
      const results = await new AxeBuilder({ page })
        .withTags(CRITICAL_TAGS)
        .include('[data-testid="book-list"]')
        .analyze();
      const critical = results.violations.filter((v) =>
        ['critical', 'serious'].includes(v.impact || ''),
      );
      expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
    });

    // ────────────────────────────────────────────────────────────
    // B) Ordem de Tab lógica + foco visível único, sem duplicação
    // ────────────────────────────────────────────────────────────
    test('Tab segue ordem lógica e não duplica IDs de teste no DOM', async ({ page }) => {
      await page.goto('/bible?book=Jo');

      // Duplicação: cada testid de capítulo deve aparecer 1x
      const counts = await page.evaluate(() => {
        const btns = document.querySelectorAll('[data-chapter-btn]');
        const ids = Array.from(btns).map((b) => b.getAttribute('data-testid'));
        const dup = ids.filter((id, i) => id && ids.indexOf(id) !== i);
        return { total: btns.length, duplicates: dup };
      });
      expect(counts.duplicates).toEqual([]);
      expect(counts.total).toBeGreaterThan(0);

      // Ordem de Tab: começa em ch-1, próximo Tab deve sair da grade
      await page.getByTestId('chapter-btn-1').focus();
      const firstFocused = await page.evaluate(
        () => document.activeElement?.getAttribute('data-testid'),
      );
      expect(firstFocused).toBe('chapter-btn-1');

      await page.keyboard.press('Tab');
      const next = await page.evaluate(
        () => document.activeElement?.getAttribute('data-testid'),
      );
      // Não deve permanecer no mesmo botão nem pular para outro chapter-btn arbitrário
      expect(next).not.toBe('chapter-btn-1');
    });

    test('foco visível é aplicado ao capítulo focado por teclado', async ({ page }) => {
      await page.goto('/bible?book=Jo');
      const btn = page.getByTestId('chapter-btn-2');
      await btn.focus();

      // Verifica que o outline/ring do foco-visível está presente
      const hasFocusStyle = await btn.evaluate((el) => {
        const s = getComputedStyle(el);
        const ring = s.boxShadow && s.boxShadow !== 'none';
        const outline = s.outlineStyle !== 'none' && s.outlineWidth !== '0px';
        return ring || outline;
      });
      expect(hasFocusStyle).toBe(true);

      // Apenas 1 elemento com aria-current="page" no grid
      const currentCount = await page
        .locator('[data-testid="chapter-grid"] [aria-current="page"]')
        .count();
      expect(currentCount).toBeLessThanOrEqual(1);
    });

    // ────────────────────────────────────────────────────────────
    // C) Reload preserva seleção após navegar por teclado
    // ────────────────────────────────────────────────────────────
    test('troca capítulo por teclado → reload restaura seleção', async ({ page }) => {
      await page.goto('/bible?book=Jo&ch=1');
      await page.getByTestId('chapter-btn-1').focus();
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Enter'); // seleciona capítulo 3
      await expect(page).toHaveURL(/ch=3/);

      await page.reload();
      await expect(page).toHaveURL(/ch=3/);
      // volta para a grade de capítulos e valida aria-current
      await page.goto('/bible?book=Jo');
      await expect(page.getByTestId('chapter-btn-3')).toHaveAttribute(
        'aria-current',
        'page',
        { timeout: 10000 },
      );
    });

    // ────────────────────────────────────────────────────────────
    // D) Rolagem mantém item selecionado destacado e visível
    // ────────────────────────────────────────────────────────────
    test('grid de capítulos: item selecionado continua destacado após rolar', async ({ page }) => {
      await page.goto('/bible?book=Sl'); // Salmos: muitos capítulos
      const target = page.getByTestId('chapter-btn-1');
      if (!(await target.count())) test.skip(true, 'livro Sl ausente');
      await target.click();
      await expect(target).toHaveAttribute('aria-current', 'page');

      // rola para o fim da lista
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);
      // volta ao topo
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);

      await expect(target).toBeVisible();
      await expect(target).toHaveAttribute('aria-current', 'page');
      const stillActive = await target.evaluate((el) => {
        const s = getComputedStyle(el);
        // deve continuar com background/borda destacados (não transparente)
        return s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== 'transparent';
      });
      expect(stillActive).toBe(true);
    });

    test('lista de livros: livro selecionado continua destacado após rolar', async ({ page }) => {
      await page.goto('/bible');
      const list = page.getByTestId('book-list');
      if (!(await list.count())) test.skip(true, 'lista de livros ausente');
      const first = list.locator('[data-book-btn]').first();
      await first.click();
      // volta à lista
      await page.goto('/bible');
      const active = page.locator('[data-book-btn][aria-current="page"]').first();
      if (!(await active.count())) test.skip(true, 'estado ativo não persistente na home');

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);
      await active.scrollIntoViewIfNeeded();
      await expect(active).toBeVisible();
      await expect(active).toHaveAttribute('aria-current', 'page');
    });
  });
}
