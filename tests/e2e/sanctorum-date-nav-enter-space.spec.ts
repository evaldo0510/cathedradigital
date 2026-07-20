import { test, expect } from '@playwright/test';

/**
 * Enter e Espaço nos controles do SanctorumDateNav:
 *  - Ambas as teclas ativam o botão focado (comportamento nativo <button>).
 *  - A data selecionada avança/retrocede corretamente e o heading em pt-BR
 *    reflete a nova data ("dd de MMMM" + dia da semana em pt-BR).
 *  - aria-live=polite / aria-atomic=true permanecem estáveis.
 */
const DIAS = [
  'domingo','segunda-feira','terça-feira','quarta-feira',
  'quinta-feira','sexta-feira','sábado',
];

test('SanctorumDateNav — Enter/Espaço atualizam data, heading pt-BR e aria-live', async ({ page }) => {
  await page.goto('/santos?date=2026-07-20', { waitUntil: 'domcontentloaded' });

  const heading = page.getByRole('heading', { level: 2 }).first();
  const region = page
    .locator('[aria-live="polite"][aria-atomic="true"]')
    .filter({ has: heading })
    .first();
  await expect(heading).toHaveText(/^20 de julho$/i);
  await expect(region).toContainText(new RegExp(DIAS[new Date(2026, 6, 20).getDay()], 'i'));

  // Enter em "Próximo dia" → 21/07 (terça)
  const proximo = page.getByRole('button', { name: 'Próximo dia' });
  await proximo.focus();
  await page.keyboard.press('Enter');
  await expect(heading).toHaveText(/^21 de julho$/i);
  await expect(region).toContainText(new RegExp(DIAS[new Date(2026, 6, 21).getDay()], 'i'));
  await expect(region).toHaveAttribute('aria-live', 'polite');

  // Espaço em "Próximo dia" → 22/07 (quarta)
  await proximo.focus();
  await page.keyboard.press('Space');
  await expect(heading).toHaveText(/^22 de julho$/i);
  await expect(region).toContainText(new RegExp(DIAS[new Date(2026, 6, 22).getDay()], 'i'));

  // Enter em "Dia anterior" → 21/07
  const anterior = page.getByRole('button', { name: 'Dia anterior' });
  await anterior.focus();
  await page.keyboard.press('Enter');
  await expect(heading).toHaveText(/^21 de julho$/i);

  // Espaço em "Semana anterior" → 14/07
  const semanaAnt = page.getByRole('button', { name: 'Semana anterior' });
  await semanaAnt.focus();
  await page.keyboard.press('Space');
  await expect(heading).toHaveText(/^14 de julho$/i);
  await expect(region).toContainText(new RegExp(DIAS[new Date(2026, 6, 14).getDay()], 'i'));

  // Enter em "Próxima semana" → 21/07
  const semanaProx = page.getByRole('button', { name: 'Próxima semana' });
  await semanaProx.focus();
  await page.keyboard.press('Enter');
  await expect(heading).toHaveText(/^21 de julho$/i);

  // Espaço em uma pill da tira → heading espelha o aria-label
  const pills = page.getByTestId('sanctorum-date-strip').locator('button');
  const total = await pills.count();
  const atual = ((await heading.textContent()) ?? '').trim().toLowerCase();
  let pickedLabel = '';
  for (let i = 0; i < total; i++) {
    const label = ((await pills.nth(i).getAttribute('aria-label')) ?? '').toLowerCase();
    if (label && label !== atual) {
      pickedLabel = label;
      await pills.nth(i).focus();
      await page.keyboard.press('Space');
      break;
    }
  }
  expect(pickedLabel).not.toBe('');
  await expect
    .poll(async () => ((await heading.textContent()) ?? '').trim().toLowerCase())
    .toBe(pickedLabel);

  // aria-live permanece ativo ao final
  await expect(region).toHaveAttribute('aria-live', 'polite');
  await expect(region).toHaveAttribute('aria-atomic', 'true');
});
