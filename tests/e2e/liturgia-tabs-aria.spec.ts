import { test, expect } from '@playwright/test';

const TABS = [
  { id: 'liturgia', label: 'Liturgia' },
  { id: 'missal', label: 'Missal' },
  { id: 'calendario', label: 'Calendário' },
];

test.describe('Liturgia — ARIA das abas (role/aria-controls/tabIndex)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  async function assertAriaState(page, activeIdx) {
    const tabs = page.getByRole('tab');
    for (let i = 0; i < TABS.length; i++) {
      const t = tabs.nth(i);
      await expect(t).toHaveAttribute('role', 'tab');
      await expect(t).toHaveAttribute('id', `tab-${TABS[i].id}`);
      await expect(t).toHaveAttribute('aria-controls', `panel-${TABS[i].id}`);
      await expect(t).toHaveAttribute(
        'aria-selected',
        i === activeIdx ? 'true' : 'false',
      );
      // Roving tabindex: só a ativa é focável por Tab
      await expect(t).toHaveAttribute('tabindex', i === activeIdx ? '0' : '-1');
    }
    // tablist presente
    await expect(page.getByRole('tablist', { name: /Navegação da Liturgia/i })).toBeVisible();
  }

  test('clique atualiza aria-selected/tabindex corretamente', async ({ page }) => {
    await page.goto('/liturgia');
    await page.waitForLoadState('networkidle');

    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(TABS.length);

    for (let i = 0; i < TABS.length; i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(120);
      await assertAriaState(page, i);
    }
  });

  test('teclado (Arrow + Enter) atualiza aria-selected/tabindex', async ({ page }) => {
    await page.goto('/liturgia');
    await page.waitForLoadState('networkidle');

    const tabs = page.getByRole('tab');
    await tabs.first().focus();
    await assertAriaState(page, 0);

    // Navega e seleciona cada aba via teclado
    for (let i = 1; i < TABS.length; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(80);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(150);
      await assertAriaState(page, i);
    }

    // Home volta para primeira
    await page.keyboard.press('Home');
    await page.waitForTimeout(80);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
    await assertAriaState(page, 0);
  });
});
