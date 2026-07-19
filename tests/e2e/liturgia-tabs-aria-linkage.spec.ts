import { test, expect } from '@playwright/test';

test.describe('Liturgia — linkage ARIA completo (tablist/tabpanel/aria-controls/aria-labelledby)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('IDs, aria-controls e aria-labelledby coerentes ao alternar por clique e teclado', async ({ page }) => {
    await page.goto('/liturgia');
    await page.waitForLoadState('networkidle');

    const tablist = page.getByRole('tablist', { name: /Navegação da Liturgia/i });
    await expect(tablist).toBeVisible();

    // Estrutura básica
    await expect(tablist).toHaveAttribute('role', 'tablist');

    const tabs = page.getByRole('tab');
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(3);

    async function assertLinkageFor(index: number, source: 'click' | 'keyboard') {
      const tab = tabs.nth(index);
      await expect(tab, `[${source}] aba ${index} aria-selected`).toHaveAttribute('aria-selected', 'true');

      const tabInfo = await tab.evaluate((el) => ({
        id: el.getAttribute('id'),
        controls: el.getAttribute('aria-controls'),
        role: el.getAttribute('role'),
        tabindex: el.getAttribute('tabindex'),
      }));

      expect(tabInfo.role, `[${source}] role da aba ${index}`).toBe('tab');
      expect(tabInfo.id, `[${source}] id da aba ${index}`).toBeTruthy();
      expect(tabInfo.controls, `[${source}] aria-controls da aba ${index}`).toBeTruthy();
      expect(tabInfo.tabindex, `[${source}] roving tabindex ativo = 0`).toBe('0');

      // O painel referenciado deve existir, ter role=tabpanel e aria-labelledby apontando à aba
      const panel = page.locator(`#${CSS.escape(tabInfo.controls!)}`);
      await expect(panel, `[${source}] painel #${tabInfo.controls} existe`).toHaveCount(1);
      const panelInfo = await panel.evaluate((el) => ({
        role: el.getAttribute('role'),
        labelledby: el.getAttribute('aria-labelledby'),
        hidden: el.getAttribute('hidden') !== null || (el as HTMLElement).hidden,
        dataState: el.getAttribute('data-state'),
      }));
      expect(panelInfo.role, `[${source}] role do painel`).toBe('tabpanel');
      expect(panelInfo.labelledby, `[${source}] aria-labelledby ↔ id da aba`).toBe(tabInfo.id);
      expect(panelInfo.hidden, `[${source}] painel ativo não pode estar hidden`).toBe(false);

      // Painéis inativos: hidden + tabindex não permite entrar
      for (let j = 0; j < count; j++) {
        if (j === index) continue;
        const other = tabs.nth(j);
        const otherInfo = await other.evaluate((el) => ({
          controls: el.getAttribute('aria-controls'),
          tabindex: el.getAttribute('tabindex'),
        }));
        expect(otherInfo.tabindex, `[${source}] roving tabindex inativo aba ${j}`).toBe('-1');
        if (otherInfo.controls) {
          const otherPanel = page.locator(`#${CSS.escape(otherInfo.controls)}`);
          if (await otherPanel.count()) {
            const state = await otherPanel.evaluate(
              (el) => (el as HTMLElement).hidden || el.getAttribute('data-state') === 'inactive',
            );
            expect(state, `[${source}] painel inativo ${j} escondido`).toBe(true);
          }
        }
      }
    }

    // 1) Alternância por clique em cada aba
    for (let i = 0; i < count; i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(120);
      await assertLinkageFor(i, 'click');
    }

    // 2) Alternância por teclado (Home + ArrowRight + Enter)
    await tabs.first().focus();
    await page.keyboard.press('Home');
    await page.waitForTimeout(80);
    await page.keyboard.press('Enter');
    await assertLinkageFor(0, 'keyboard');

    for (let i = 1; i < count; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(80);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);
      await assertLinkageFor(i, 'keyboard');
    }

    // IDs de abas devem ser únicos
    const ids = await tabs.evaluateAll((els) => els.map((el) => el.getAttribute('id')));
    const unique = new Set(ids.filter(Boolean));
    expect(unique.size, 'IDs de tabs únicos').toBe(ids.length);
  });
});
