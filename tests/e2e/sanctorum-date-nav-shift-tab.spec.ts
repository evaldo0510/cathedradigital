import { test, expect } from '@playwright/test';

/**
 * Navegação reversa por Shift+Tab no SanctorumDateNav:
 *  - A partir de uma pill da tira, Shift+Tab retrocede pelos controles
 *    principais (Escolher data → Ir para hoje → Próxima semana → Próximo dia →
 *    Dia anterior → Semana anterior), preservando aria-label previsível.
 *  - Após esgotar os controles do componente, o próximo Shift+Tab sai do
 *    SanctorumDateNav (foco não permanece mais dentro do role="group"
 *    "Navegação por data").
 *  - O heading permanece atualizado e a região aria-live continua polite/atomic
 *    durante todo o percurso.
 */
test('SanctorumDateNav — Shift+Tab retrocede e sai do componente com aria-live ativo', async ({ page }) => {
  await page.goto('/santos?date=2026-07-20', { waitUntil: 'domcontentloaded' });

  const grupo = page.getByRole('group', { name: 'Navegação por data' });
  await expect(grupo).toBeVisible();

  const heading = page.getByRole('heading', { level: 2 }).first();
  const region = page
    .locator('[aria-live="polite"][aria-atomic="true"]')
    .filter({ has: heading })
    .first();
  await expect(heading).toHaveText(/^20 de julho$/i);

  // Confirma uma mudança inicial para provar que aria-live está funcional
  await page.getByRole('button', { name: 'Próximo dia' }).click();
  await expect(heading).toHaveText(/^21 de julho$/i);
  await expect(region).toHaveAttribute('aria-live', 'polite');
  await expect(region).toHaveAttribute('aria-atomic', 'true');

  // Ponto de partida: a primeira pill da tira
  const pills = page.getByTestId('sanctorum-date-strip').locator('button');
  const primeiraPill = pills.first();
  await primeiraPill.focus();
  await expect(primeiraPill).toBeFocused();

  // Helper: label do elemento focado atualmente
  const focusedLabel = async () =>
    page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return null;
      return (
        el.getAttribute('aria-label') ||
        el.textContent?.trim() ||
        el.tagName
      );
    });

  // Coleta a sequência de labels ao pressionar Shift+Tab várias vezes.
  const sequencia: (string | null)[] = [await focusedLabel()];
  const MAX_STEPS = 20;
  for (let i = 0; i < MAX_STEPS; i++) {
    await page.keyboard.press('Shift+Tab');
    sequencia.push(await focusedLabel());
    const dentro = await page.evaluate(() => {
      const grupo = document.querySelector('[role="group"][aria-label="Navegação por data"]');
      return !!grupo && !!document.activeElement && grupo.contains(document.activeElement);
    });
    if (!dentro) break;
  }

  // Deve ter saído do componente em algum momento (< MAX_STEPS iterações).
  const saiuDoComponente = await page.evaluate(() => {
    const grupo = document.querySelector('[role="group"][aria-label="Navegação por data"]');
    return !!grupo && !grupo.contains(document.activeElement);
  });
  expect(saiuDoComponente, 'Shift+Tab deveria eventualmente sair do SanctorumDateNav').toBe(true);

  // Ao longo do caminho, todos os controles principais precisam ter aparecido
  // na ordem reversa esperada — sem depender de posições absolutas (que podem
  // variar conforme dispositivo), garantimos apenas presença e ordem relativa.
  const esperadosReverso = [
    'Escolher data no calendário',
    'Ir para hoje',
    'Próxima semana',
    'Próximo dia',
    'Dia anterior',
    'Semana anterior',
  ];
  const labels = sequencia.filter((l): l is string => !!l);
  let cursor = 0;
  for (const alvo of esperadosReverso) {
    const idx = labels.indexOf(alvo, cursor);
    expect(idx, `esperava ${alvo} depois da posição ${cursor} em ${JSON.stringify(labels)}`).toBeGreaterThanOrEqual(cursor);
    cursor = idx + 1;
  }

  // heading permanece intacto e aria-live continua ativo ao final do percurso.
  await expect(heading).toHaveText(/^21 de julho$/i);
  await expect(region).toHaveAttribute('aria-live', 'polite');
  await expect(region).toHaveAttribute('aria-atomic', 'true');

  // Uma última interação de teclado confirma que o componente ainda anuncia
  // trocas mesmo após o foco ter saído e retornado.
  await page.getByRole('button', { name: 'Dia anterior' }).focus();
  await page.keyboard.press('Enter');
  await expect(heading).toHaveText(/^20 de julho$/i);
});
