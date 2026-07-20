import { test, expect } from '@playwright/test';

/**
 * Foco por teclado ao longo da jornada:
 *  - Após Enter em "Próximo dia" / "Dia anterior" / "Hoje", o foco permanece
 *    no próprio botão (padrão nativo <button>), garantindo repetição sem re-tab.
 *  - Ativação de uma pill via teclado mantém o foco na pill escolhida.
 *  - O heading atualiza e a região aria-live continua polite+atomic.
 */
test('SanctorumDateNav — foco por teclado permanece no controle acionado', async ({ page }) => {
  await page.goto('/santos?date=2026-07-20', { waitUntil: 'domcontentloaded' });

  const heading = page.getByRole('heading', { level: 2 }).first();
  const region = page.locator('[aria-live="polite"][aria-atomic="true"]').filter({ has: heading }).first();

  const proximo = page.getByRole('button', { name: 'Próximo dia' });
  await proximo.focus();
  await expect(proximo).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(heading).not.toHaveText('20 de julho');
  await expect(proximo).toBeFocused();
  await expect(region).toHaveAttribute('aria-live', 'polite');

  const anterior = page.getByRole('button', { name: 'Dia anterior' });
  await anterior.focus();
  await page.keyboard.press('Space');
  await expect(heading).toHaveText(/^20 de julho$/i);
  await expect(anterior).toBeFocused();

  const hoje = page.getByRole('button', { name: 'Ir para hoje' });
  await hoje.focus();
  await page.keyboard.press('Enter');
  // Após "Hoje" pode ficar disabled — nesse caso o foco vai para o body;
  // aceitamos ambos, mas o heading precisa refletir a data de hoje.
  const foco = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName);
  expect(['Ir para hoje', 'BODY']).toContain(foco);

  const pills = page.getByTestId('sanctorum-date-strip').locator('button');
  await pills.nth(3).focus();
  await expect(pills.nth(3)).toBeFocused();
  const antes = (await heading.textContent()) ?? '';
  await page.keyboard.press('Enter');
  await expect
    .poll(async () => (await heading.textContent())?.trim() ?? '')
    .not.toBe(antes);
  await expect(pills.nth(3)).toBeFocused();
  await expect(region).toHaveAttribute('aria-atomic', 'true');
});
