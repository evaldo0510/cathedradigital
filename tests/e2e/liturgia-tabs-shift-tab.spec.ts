import { test, expect } from '@playwright/test';

test.describe('Liturgia — Shift+Tab (navegação reversa preserva foco/aria-selected)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('Shift+Tab percorre as abas na ordem reversa e mantém consistência', async ({ page }) => {
    await page.goto('/liturgia');
    await page.waitForLoadState('networkidle');

    const tabs = page.getByRole('tab');
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Foca a última aba e ativa (Enter) — âncora conhecida
    await tabs.nth(count - 1).focus();
    await page.keyboard.press('Enter');
    await expect(tabs.nth(count - 1)).toHaveAttribute('aria-selected', 'true');

    // Roving tabindex: ArrowLeft move o foco para trás dentro da tablist
    for (let i = count - 1; i > 0; i--) {
      await expect(tabs.nth(i)).toBeFocused();
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(80);
      await expect(tabs.nth(i - 1)).toBeFocused();
    }

    // Ativa a primeira via Enter e valida aria-selected
    await page.keyboard.press('Enter');
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    for (let i = 1; i < count; i++) {
      await expect(tabs.nth(i)).toHaveAttribute('aria-selected', 'false');
    }

    // Shift+Tab a partir da aba ativa deve sair da tablist para trás (não avança dentro)
    await tabs.first().focus();
    await page.keyboard.press('Shift+Tab');
    await page.waitForTimeout(80);
    const stillInsideTablist = await page.evaluate(() => {
      const el = document.activeElement;
      return !!el?.closest('[role="tablist"][aria-label*="Liturgia"]');
    });
    expect(stillInsideTablist, 'Shift+Tab não deve permanecer dentro da tablist').toBe(false);

    // aria-selected permanece consistente (uma única aba selecionada)
    const selectedCount = await tabs.evaluateAll(
      (els) => els.filter((el) => el.getAttribute('aria-selected') === 'true').length,
    );
    expect(selectedCount).toBe(1);

    // Retornando com Tab, o foco volta para a aba ativa (não para uma inativa)
    await page.keyboard.press('Tab');
    await page.waitForTimeout(80);
    await expect(tabs.first()).toBeFocused();
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
  });
});
