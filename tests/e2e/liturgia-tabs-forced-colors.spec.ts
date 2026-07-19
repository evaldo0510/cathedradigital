import { test, expect } from '@playwright/test';

test.describe('Liturgia — forced-colors / High Contrast (contraste, foco, teclado)', () => {
  test.use({
    viewport: { width: 1280, height: 900 },
    forcedColors: 'active',
    colorScheme: 'dark',
  });

  test('abas respeitam forced-colors e navegam por teclado sem quebras', async ({ page }) => {
    await page.goto('/liturgia');
    await page.waitForLoadState('networkidle');

    // Sanity: matchMedia confirma forced-colors ativo
    const forced = await page.evaluate(
      () => window.matchMedia('(forced-colors: active)').matches,
    );
    expect(forced, 'forced-colors deve estar ativo').toBe(true);

    const tablist = page.getByRole('tablist', { name: /Navegação da Liturgia/i });
    await expect(tablist).toBeVisible();
    await tablist.scrollIntoViewIfNeeded();

    const tabs = page.getByRole('tab');
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Cada aba deve usar system colors (não pode forçar cores custom que o SO ignore)
    for (let i = 0; i < count; i++) {
      const s = await tabs.nth(i).evaluate((el) => {
        const cs = getComputedStyle(el);
        return { color: cs.color, bg: cs.backgroundColor, visibility: cs.visibility, display: cs.display };
      });
      // Elemento continua visível
      expect(s.visibility, `aba ${i} visibility`).not.toBe('hidden');
      expect(s.display, `aba ${i} display`).not.toBe('none');
      // Não pode ser transparente (usuário perde contorno)
      expect(s.bg, `aba ${i} background transparente em forced-colors`).not.toBe('rgba(0, 0, 0, 0)');
    }

    // Navegação por teclado funciona
    await tabs.first().focus();
    await expect(tabs.first()).toBeFocused();

    for (let i = 0; i < count - 1; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(80);
      await expect(tabs.nth(i + 1)).toBeFocused();
    }
    await page.keyboard.press('Enter');
    await expect(tabs.nth(count - 1)).toHaveAttribute('aria-selected', 'true');

    // Foco visível: outline OU box-shadow presente no elemento focado
    const focusIndicator = await tabs.nth(count - 1).evaluate((el) => {
      const cs = getComputedStyle(el);
      const outlineW = parseFloat(cs.outlineWidth) || 0;
      const hasShadow = cs.boxShadow && cs.boxShadow !== 'none';
      return { outlineW, outlineStyle: cs.outlineStyle, hasShadow };
    });
    const hasVisibleFocus =
      (focusIndicator.outlineW >= 1 && focusIndicator.outlineStyle !== 'none') ||
      focusIndicator.hasShadow;
    expect(hasVisibleFocus, 'foco não visível em forced-colors').toBe(true);

    // Home/End funcionam
    await page.keyboard.press('Home');
    await expect(tabs.first()).toBeFocused();
    await page.keyboard.press('End');
    await expect(tabs.nth(count - 1)).toBeFocused();

    // Sem overflow horizontal
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow, 'overflow horizontal em forced-colors').toBe(false);
  });
});
