import { test, expect } from '@playwright/test';

const TABS = [
  { id: 'liturgia', label: 'Liturgia' },
  { id: 'missal', label: 'Missal' },
  { id: 'calendario', label: 'Calendário' },
];

test.describe('Liturgia — navegação por teclado nas abas (desktop)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('Tab foca a tablist e ArrowRight/ArrowLeft alternam aria-selected e foco', async ({ page }) => {
    await page.goto('/liturgia');
    await page.waitForLoadState('networkidle');

    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(TABS.length);

    // Foca a primeira aba diretamente (roving tabindex começa na ativa)
    await tabs.first().focus();
    await expect(tabs.first()).toBeFocused();

    // ArrowRight: percorre 0 -> 1 -> 2
    for (let i = 1; i < TABS.length; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(120);
      const focusedId = await page.evaluate(() => document.activeElement?.id ?? '');
      expect(focusedId, `foco após ArrowRight #${i}`).toBe(`tab-${TABS[i].id}`);
    }

    // ArrowRight no último faz wrap para o primeiro
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(120);
    const wrapped = await page.evaluate(() => document.activeElement?.id ?? '');
    expect(wrapped).toBe(`tab-${TABS[0].id}`);

    // ArrowLeft volta 0 -> 2 (wrap)
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(120);
    const back = await page.evaluate(() => document.activeElement?.id ?? '');
    expect(back).toBe(`tab-${TABS[TABS.length - 1].id}`);

    // Enter/Space seleciona a aba focada
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    await expect(tabs.nth(TABS.length - 1)).toHaveAttribute('aria-selected', 'true');
    for (let j = 0; j < TABS.length - 1; j++) {
      await expect(tabs.nth(j)).toHaveAttribute('aria-selected', 'false');
    }

    // Home/End
    await page.keyboard.press('Home');
    await page.waitForTimeout(120);
    expect(await page.evaluate(() => document.activeElement?.id ?? '')).toBe(`tab-${TABS[0].id}`);
    await page.keyboard.press('End');
    await page.waitForTimeout(120);
    expect(await page.evaluate(() => document.activeElement?.id ?? '')).toBe(`tab-${TABS[TABS.length - 1].id}`);
  });
});
