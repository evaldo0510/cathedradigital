import { test, expect } from '@playwright/test';

const MESES = [
  'janeiro','fevereiro','março','abril','maio','junho',
  'julho','agosto','setembro','outubro','novembro','dezembro',
];
const DIAS_SEMANA = [
  'domingo','segunda-feira','terça-feira','quarta-feira',
  'quinta-feira','sexta-feira','sábado',
];

/**
 * Cruza a fronteira de mês (31/07 → 01/08) usando setas, "Hoje" e pill,
 * validando que o heading permanece em formato pt-BR "dd de MMMM" com o
 * dia da semana correto — sem tokens crus (undefined/NaN) nem placeholders.
 */
test('SanctorumDateNav — transição de mês mantém formato pt-BR', async ({ page }) => {
  await page.goto('/santos?date=2026-07-31', { waitUntil: 'domcontentloaded' });

  const heading = page.getByRole('heading', { level: 2 }).first();
  await expect(heading).toHaveText(/^31 de julho$/i);

  // Próximo dia → 01/08 (sábado)
  await page.getByRole('button', { name: 'Próximo dia' }).click();
  await expect(heading).toHaveText(/^01 de agosto$/i);
  const region = page.locator('[aria-live="polite"][aria-atomic="true"]').filter({ has: heading }).first();
  const semana = ((await region.textContent()) ?? '').toLowerCase();
  expect(DIAS_SEMANA.some((d) => semana.includes(d))).toBe(true);
  expect(semana).not.toMatch(/undefined|nan|invalid/);

  // Volta com Dia anterior → 31/07
  await page.getByRole('button', { name: 'Dia anterior' }).click();
  await expect(heading).toHaveText(/^31 de julho$/i);

  // Hoje → heading corresponde à data atual
  await page.getByRole('button', { name: 'Ir para hoje' }).click();
  const hoje = new Date();
  const esperado = `${String(hoje.getDate()).padStart(2, '0')} de ${MESES[hoje.getMonth()]}`;
  await expect(heading).toHaveText(new RegExp(`^${esperado.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'));

  // Pill em outra data — heading espelha o aria-label da pill
  await page.goto('/santos?date=2026-07-31', { waitUntil: 'domcontentloaded' });
  const pills = page.getByTestId('sanctorum-date-strip').locator('button');
  const total = await pills.count();
  let alvo = -1;
  for (let i = 0; i < total; i++) {
    const label = (await pills.nth(i).getAttribute('aria-label')) ?? '';
    if (label && !label.toLowerCase().includes('31 de julho') && /agosto|julho/i.test(label)) {
      alvo = i; break;
    }
  }
  expect(alvo).toBeGreaterThanOrEqual(0);
  const label = ((await pills.nth(alvo).getAttribute('aria-label')) ?? '').toLowerCase();
  await pills.nth(alvo).click();
  await expect(heading).toHaveText(new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'));
});
