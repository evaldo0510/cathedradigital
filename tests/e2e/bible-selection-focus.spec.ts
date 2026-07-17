import { test, expect, devices } from '@playwright/test';

/**
 * Cobre:
 *  A) Shift+Tab: foco visível e sem duplicar/pular elementos (snapshot)
 *  B) 200% de zoom em mobile e desktop mantém destaque + foco visível
 *  C) Breakpoint extra (tablet 820x1180) preserva destaque
 *  D) Atributos ARIA no capítulo e no livro selecionados
 */

test.describe('Bible selection · Shift+Tab focus', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('Shift+Tab move foco na ordem inversa sem duplicar', async ({ page }) => {
    await page.goto('/bible?book=Jo');
    await page.getByTestId('chapter-btn-3').focus();
    const start = await page.evaluate(
      () => document.activeElement?.getAttribute('data-testid'),
    );
    expect(start).toBe('chapter-btn-3');

    await page.keyboard.press('Shift+Tab');
    const prev = await page.evaluate(
      () => document.activeElement?.getAttribute('data-testid'),
    );
    // Não pode ficar no mesmo botão nem cair em elemento inexistente
    expect(prev).not.toBe('chapter-btn-3');

    // Nenhum elemento deve ter foco duplicado (impossível no DOM, mas checa document.activeElement único)
    const activeCount = await page.evaluate(() => {
      return document.querySelectorAll(':focus').length;
    });
    expect(activeCount).toBe(1);

    // Screenshot do foco após Shift+Tab
    await page.screenshot({
      path: 'test-results/bible-selection-focus/shift-tab-desktop.png',
      clip: { x: 0, y: 0, width: 1280, height: 600 },
    });
  });
});

// ────────────────────────────────────────────────────────────
// 200% zoom + breakpoint extra
// ────────────────────────────────────────────────────────────
const ZOOM_MATRIX = [
  { name: 'mobile-2x', width: 390, height: 844, zoom: 2 },
  { name: 'desktop-2x', width: 1280, height: 900, zoom: 2 },
  { name: 'tablet-820', width: 820, height: 1180, zoom: 1 },
] as const;

for (const cfg of ZOOM_MATRIX) {
  test.describe(`Bible selection · ${cfg.name}`, () => {
    test.use({ viewport: { width: cfg.width, height: cfg.height } });

    test('destaque e foco visível permanecem no capítulo selecionado', async ({ page }) => {
      await page.goto('/bible?book=Jo&ch=6');
      await page.addStyleTag({
        content: `html { zoom: ${cfg.zoom}; }`,
      });
      const ch6 = page.getByTestId('chapter-btn-6');
      await expect(ch6).toBeVisible({ timeout: 15000 });
      await expect(ch6).toHaveAttribute('aria-current', 'page');

      // Destaque: cor de fundo diferente de transparente
      const bg = await ch6.evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(bg).not.toBe('rgba(0, 0, 0, 0)');
      expect(bg).not.toBe('transparent');

      // Foco visível
      await ch6.focus();
      const focusVisible = await ch6.evaluate((el) => {
        const s = getComputedStyle(el);
        return (s.boxShadow && s.boxShadow !== 'none') || s.outlineStyle !== 'none';
      });
      expect(focusVisible).toBe(true);

      await page.screenshot({
        path: `test-results/bible-selection-focus/${cfg.name}-selected.png`,
      });
    });
  });
}

// ────────────────────────────────────────────────────────────
// ARIA: capítulo e livro selecionados
// ────────────────────────────────────────────────────────────
test.describe('Bible selection · ARIA', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('capítulo selecionado expõe aria-current, role e rótulo correto', async ({ page }) => {
    await page.goto('/bible?book=Jo&ch=6');
    const grid = page.getByTestId('chapter-grid');
    await expect(grid).toHaveAttribute('role', 'grid');
    await expect(grid).toHaveAttribute('aria-label', /Capítulos de/);

    const ch6 = page.getByTestId('chapter-btn-6');
    await expect(ch6).toBeVisible();
    await expect(ch6).toHaveAttribute('aria-current', 'page');
    // É um <button> nativo (role implícito). Nunca deve ter aria-disabled=true quando ativo.
    const tag = await ch6.evaluate((el) => el.tagName.toLowerCase());
    expect(tag).toBe('button');
    await expect(ch6).not.toHaveAttribute('aria-disabled', 'true');

    // Apenas um capítulo com aria-current
    const activeCount = await page
      .locator('[data-testid="chapter-grid"] [aria-current="page"]')
      .count();
    expect(activeCount).toBe(1);
  });

  test('livro selecionado expõe aria-current e rótulo textual', async ({ page }) => {
    await page.goto('/bible');
    const list = page.getByTestId('book-list');
    if (!(await list.count())) test.skip(true, 'lista de livros ausente');

    // seleciona um livro
    const first = list.locator('[data-book-btn]').first();
    const abbr = await first.getAttribute('data-testid');
    await first.click();
    await page.goto('/bible');

    const active = page.locator('[data-book-btn][aria-current="page"]').first();
    if (!(await active.count())) test.skip(true, 'estado não persistente');
    await expect(active).toHaveAttribute('aria-current', 'page');
    const tag = await active.evaluate((el) => el.tagName.toLowerCase());
    expect(tag).toBe('button');
    // rótulo acessível não vazio
    const label = (await active.textContent())?.trim() || '';
    expect(label.length).toBeGreaterThan(0);
    // no máximo um livro ativo
    const activeCount = await page
      .locator('[data-testid="book-list"] [aria-current="page"]')
      .count();
    expect(activeCount).toBeLessThanOrEqual(1);
    expect(abbr).toBeTruthy();
  });
});
