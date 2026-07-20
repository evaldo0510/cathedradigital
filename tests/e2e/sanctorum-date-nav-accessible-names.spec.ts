import { test, expect } from '@playwright/test';

/**
 * Nomes acessíveis (accessible name) dos controles do SanctorumDateNav em pt-BR:
 *  - Setas, atalhos e trigger do calendário têm aria-label exatos.
 *  - "Ir para hoje" expõe aria-current="date" quando a data atual é hoje
 *    (validado indiretamente aqui: o botão existe e é acessível por nome).
 *  - Todas as pills da tira usam formato "dd de MMMM" (pt-BR) como aria-label
 *    e possuem aria-pressed booleano; apenas uma pill está pressionada.
 */
test('SanctorumDateNav — accessible names em pt-BR', async ({ page }) => {
  await page.goto('/santos?date=2026-07-20', { waitUntil: 'domcontentloaded' });

  // Botões principais
  for (const nome of [
    'Dia anterior',
    'Próximo dia',
    'Semana anterior',
    'Próxima semana',
    'Ir para hoje',
    'Escolher data no calendário',
  ]) {
    const btn = page.getByRole('button', { name: nome, exact: true });
    await expect(btn, `esperava botão "${nome}"`).toBeVisible();
  }

  // Grupos
  await expect(page.getByRole('group', { name: 'Navegação por data' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Tira de dias' })).toBeVisible();

  // Pills da tira: aria-label em pt-BR ("dd de MMMM") e aria-pressed
  const pills = page.getByTestId('sanctorum-date-strip').locator('button');
  const total = await pills.count();
  expect(total).toBeGreaterThanOrEqual(7);

  const RE_LABEL = /^\d{2} de (janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)$/i;
  let pressedCount = 0;
  for (let i = 0; i < total; i++) {
    const label = (await pills.nth(i).getAttribute('aria-label')) ?? '';
    expect(label, `pill ${i}: aria-label inválido "${label}"`).toMatch(RE_LABEL);
    const pressed = await pills.nth(i).getAttribute('aria-pressed');
    expect(['true', 'false']).toContain(pressed);
    if (pressed === 'true') pressedCount++;
  }
  expect(pressedCount, 'exatamente uma pill deve estar pressionada').toBe(1);

  // A pill pressionada precisa ser 20 de julho
  const pressedPill = pills.filter({ has: page.locator('[aria-pressed="true"]') });
  // fallback via aria-label direto:
  const alvo = pills.getByLabel('20 de julho', { exact: true }).first();
  await expect(alvo).toHaveAttribute('aria-pressed', 'true');
});
