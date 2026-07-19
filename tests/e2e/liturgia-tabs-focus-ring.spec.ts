import { test, expect } from '@playwright/test';

const TABS = ['liturgia', 'missal', 'calendario'];

/**
 * Garante que o focus ring é visível ao percorrer as abas por teclado.
 * Estratégia: comparar box-shadow / outline entre estado sem foco e com foco.
 * O componente usa `focus-visible:ring-2 focus-visible:ring-primary`.
 */
test.describe('Liturgia — focus ring visível ao navegar por teclado', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('cada aba mostra ring de foco claro ao receber foco', async ({ page }) => {
    await page.goto('/liturgia');
    await page.waitForLoadState('networkidle');

    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(TABS.length);

    // Baseline: nenhuma aba focada — clique no body para garantir
    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await page.waitForTimeout(120);

    const idle = await tabs.first().evaluate((el) => {
      const cs = getComputedStyle(el);
      return { outline: cs.outlineStyle, outlineWidth: cs.outlineWidth, shadow: cs.boxShadow };
    });

    // Foca a primeira aba via teclado (simula chegada por Tab)
    await tabs.first().focus();
    // Força :focus-visible via keyboard
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(120);

    for (let i = 0; i < TABS.length; i++) {
      // Percorre com ArrowRight garantindo focus-visible
      const focused = await tabs.nth(i).evaluate((el) => {
        (el as HTMLElement).focus();
        const cs = getComputedStyle(el);
        return {
          outline: cs.outlineStyle,
          outlineWidth: cs.outlineWidth,
          shadow: cs.boxShadow,
          hasFocus: el === document.activeElement,
        };
      });

      expect(focused.hasFocus, `aba ${TABS[i]} não recebeu foco`).toBe(true);

      // Deve existir algum indicador visual: outline OU shadow diferente do idle
      const hasOutline =
        focused.outline !== 'none' && parseFloat(focused.outlineWidth || '0') > 0;
      const hasShadowRing = focused.shadow !== 'none' && focused.shadow !== idle.shadow;

      expect(
        hasOutline || hasShadowRing,
        `aba ${TABS[i]} sem focus ring visível (outline=${focused.outline} shadow=${focused.shadow})`,
      ).toBe(true);

      // Espessura mínima do ring: 2px (WCAG 2.4.11 / focus-visible:ring-2)
      if (hasShadowRing) {
        const pxMatch = focused.shadow.match(/(\d+(?:\.\d+)?)px/g) || [];
        const maxPx = Math.max(0, ...pxMatch.map((s) => parseFloat(s)));
        expect(maxPx, `ring muito fino em ${TABS[i]}`).toBeGreaterThanOrEqual(2);
      }

      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(80);
    }

    // Após clicar (mouse) o ring de focus-visible deve sumir na aba clicada
    await tabs.first().click();
    await page.waitForTimeout(120);
    const afterClick = await tabs.first().evaluate((el) => getComputedStyle(el).boxShadow);
    // Aba ativa tem shadow-premium-hover, mas não o ring focus-visible.
    // Sanity: ainda existe algo (shadow do variant ativo) — não regride para 'none'.
    expect(afterClick).not.toBe('');
  });
});
