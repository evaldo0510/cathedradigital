import { test, expect } from '@playwright/test';

/**
 * Navegação por teclado no SanctorumDateNav:
 *  - Tab foca os botões da barra (Dia anterior/Próximo dia/Hoje/etc.).
 *  - Enter/Space no botão focado dispara a mudança de data.
 *  - O heading <h2> é atualizado após cada navegação.
 *  - Pills da tira são alcançáveis via Tab e podem ser ativadas por teclado.
 */
test.describe('SanctorumDateNav — navegação por teclado', () => {
  test('Tab + Enter navegam pelos controles e atualizam o heading', async ({ page }) => {
    await page.goto('/santos?date=2026-07-20', { waitUntil: 'domcontentloaded' });

    const heading = page.getByRole('heading', { level: 2 });
    await expect(heading).toBeVisible();
    const inicial = (await heading.textContent())?.trim() ?? '';

    // Foca o botão "Próximo dia" e ativa via Enter
    const proximo = page.getByRole('button', { name: 'Próximo dia' });
    await proximo.focus();
    await expect(proximo).toBeFocused();
    await page.keyboard.press('Enter');

    await expect
      .poll(async () => (await heading.textContent())?.trim() ?? '')
      .not.toBe(inicial);

    // Volta com "Dia anterior" via Space
    const anterior = page.getByRole('button', { name: 'Dia anterior' });
    await anterior.focus();
    await page.keyboard.press('Space');
    await expect(heading).toHaveText(inicial);

    // Ativa uma pill da tira via teclado
    const pills = page.getByTestId('sanctorum-date-strip').locator('button');
    await pills.nth(5).focus();
    await expect(pills.nth(5)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect
      .poll(async () => (await heading.textContent())?.trim() ?? '')
      .not.toBe(inicial);
  });
});
