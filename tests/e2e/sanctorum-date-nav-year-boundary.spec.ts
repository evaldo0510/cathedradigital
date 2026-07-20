import { test, expect } from '@playwright/test';

/**
 * Transição de ano no SanctorumDateNav:
 *  - Partindo de 31/12/2026 (quinta-feira), navegar via "Próximo dia" deve
 *    levar a 01/01/2027 (sexta-feira), com heading e dia da semana em pt-BR
 *    corretos, sem falha de formatação (sem "undefined", "NaN", "Invalid Date").
 *  - aria-live continua polite/atomic durante a travessia.
 */
const MESES_PT = [
  'janeiro','fevereiro','março','abril','maio','junho',
  'julho','agosto','setembro','outubro','novembro','dezembro',
];
const DIAS_PT = [
  'domingo','segunda-feira','terça-feira','quarta-feira',
  'quinta-feira','sexta-feira','sábado',
];

test('SanctorumDateNav — 31/12 → 01/01 formata data e dia em pt-BR', async ({ page }) => {
  await page.goto('/santos?date=2026-12-31', { waitUntil: 'domcontentloaded' });

  const heading = page.getByRole('heading', { level: 2 }).first();
  const region = page
    .locator('[aria-live="polite"][aria-atomic="true"]')
    .filter({ has: heading })
    .first();

  await expect(heading).toHaveText(/^31 de dezembro$/i);
  await expect(region).toContainText(new RegExp(DIAS_PT[new Date(2026, 11, 31).getDay()], 'i'));
  await expect(region).toHaveAttribute('aria-live', 'polite');
  await expect(region).toHaveAttribute('aria-atomic', 'true');

  // Próximo dia → 01/01/2027
  await page.getByRole('button', { name: 'Próximo dia' }).click();
  await expect(heading).toHaveText(/^01 de janeiro$/i);
  const diaJan1 = DIAS_PT[new Date(2027, 0, 1).getDay()];
  await expect(region).toContainText(new RegExp(diaJan1, 'i'));

  // Verifica ausência de falhas de formatação no bloco
  const textoRegiao = ((await region.textContent()) ?? '').toLowerCase();
  for (const proibido of ['undefined', 'nan', 'invalid date', 'null']) {
    expect(textoRegiao.includes(proibido), `heading não deve conter "${proibido}"`).toBe(false);
  }
  // Mês tem que ser um dos 12 válidos em pt-BR
  expect(MESES_PT.some((m) => textoRegiao.includes(m))).toBe(true);

  // Volta a 31/12 via "Dia anterior" — travessia reversa também sã
  await page.getByRole('button', { name: 'Dia anterior' }).click();
  await expect(heading).toHaveText(/^31 de dezembro$/i);
  await expect(region).toHaveAttribute('aria-live', 'polite');
});
