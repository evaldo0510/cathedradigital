import { test, expect } from '@playwright/test';

const TABS = [
  { id: 'liturgia', label: 'Liturgia', panelId: 'panel-liturgia' },
  { id: 'missal', label: 'Missal', panelId: 'panel-missal' },
  { id: 'calendario', label: 'Calendário', panelId: 'panel-calendario' },
];

test.describe('Liturgia — conteúdo do tabpanel muda e inativos não recebem foco', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('painel ativo troca; inativos ficam ocultos e fora do fluxo de foco', async ({ page }) => {
    await page.goto('/liturgia');
    await page.waitForLoadState('networkidle');

    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(TABS.length);

    let previousHtml = '';

    for (let i = 0; i < TABS.length; i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(500); // aguarda Suspense/lazy render

      // Painel ativo existe, é visível, tem role=tabpanel e aponta para a aba
      const activePanel = page.locator(`#${TABS[i].panelId}`);
      await expect(activePanel).toBeVisible();
      await expect(activePanel).toHaveAttribute('role', 'tabpanel');
      await expect(activePanel).toHaveAttribute('aria-labelledby', `tab-${TABS[i].id}`);

      // Painéis inativos: não estão visíveis (nem no DOM, nem hidden) e nunca com tabindex=0
      for (let j = 0; j < TABS.length; j++) {
        if (j === i) continue;
        const inactive = page.locator(`#${TABS[j].panelId}`);
        const count = await inactive.count();
        if (count > 0) {
          // Se existir no DOM, deve estar hidden e não focável
          await expect(inactive).toBeHidden();
          const tabindex = await inactive.getAttribute('tabindex');
          expect(tabindex === null || tabindex === '-1', `painel inativo ${TABS[j].id} focável`).toBe(true);
        }
      }

      // Conteúdo mudou de fato entre as abas
      const html = await activePanel.innerHTML();
      expect(html.length, `painel ${TABS[i].id} vazio`).toBeGreaterThan(20);
      if (i > 0) {
        expect(html, `painel ${TABS[i].id} idêntico ao anterior`).not.toBe(previousHtml);
      }
      previousHtml = html;

      // Foco por teclado (Tab) a partir da aba ativa não entra em painel inativo
      await tabs.nth(i).focus();
      await page.keyboard.press('Tab');
      await page.waitForTimeout(120);
      const focusedInInactive = await page.evaluate((ids) => {
        const el = document.activeElement;
        if (!el) return false;
        return ids.some((id) => {
          const p = document.getElementById(id);
          return p && p !== el && p.contains(el);
        });
      }, TABS.filter((_, idx) => idx !== i).map((t) => t.panelId));
      expect(focusedInInactive, 'Tab levou o foco para painel inativo').toBe(false);
    }
  });
});
