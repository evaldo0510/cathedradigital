import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Liturgia — axe-core nas abas (contraste + nomes + teclado)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('sem violações de contraste, nomes acessíveis e ARIA nas abas', async ({ page }) => {
    await page.goto('/liturgia');
    await page.waitForLoadState('networkidle');

    const tablist = page.getByRole('tablist', { name: /Navegação da Liturgia/i });
    await expect(tablist).toBeVisible();
    await tablist.scrollIntoViewIfNeeded();

    const results = await new AxeBuilder({ page })
      .include('[role="tablist"][aria-label*="Liturgia"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      // Foco nas regras que importam para tabs: contraste, nome, ARIA e teclado
      .options({
        runOnly: {
          type: 'rule',
          values: [
            'color-contrast',
            'button-name',
            'link-name',
            'aria-allowed-attr',
            'aria-required-attr',
            'aria-valid-attr',
            'aria-valid-attr-value',
            'aria-roles',
            'focus-order-semantics',
            'tabindex',
            'nested-interactive',
          ],
        },
      })
      .analyze();

    if (results.violations.length) {
      console.log('Axe violations:', JSON.stringify(results.violations, null, 2));
    }
    expect(results.violations, 'violações axe nas abas da Liturgia').toEqual([]);

    // Sanity: cada aba tem nome acessível
    const tabs = page.getByRole('tab');
    const count = await tabs.count();
    for (let i = 0; i < count; i++) {
      const name = await tabs.nth(i).evaluate((el) => {
        return (
          (el as HTMLElement).getAttribute('aria-label') ??
          (el as HTMLElement).innerText.trim()
        );
      });
      expect(name.length, `aba ${i} sem nome acessível`).toBeGreaterThan(0);
    }

    // Sanity: teclado — foco navega e seleção via Enter altera aria-selected
    await tabs.first().focus();
    await expect(tabs.first()).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(120);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  });
});
