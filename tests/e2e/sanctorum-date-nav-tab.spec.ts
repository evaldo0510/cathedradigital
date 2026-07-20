import { test, expect } from '@playwright/test';

/**
 * Navegação direta por Tab no SanctorumDateNav:
 *  - Partindo do primeiro controle ("Dia anterior"), Tab avança pelos
 *    demais controles principais na ordem esperada (Semana anterior →
 *    Dia anterior → Próximo dia → Próxima semana → Ir para hoje →
 *    Escolher data no calendário) e depois pelas pills da tira.
 *  - Após esgotar os controles do componente, o próximo Tab sai do
 *    role="group" "Navegação por data".
 *  - O heading permanece atualizado e a região aria-live continua
 *    polite/atomic durante todo o percurso, com anúncio funcional
 *    ao ativar controles via teclado.
 */
test('SanctorumDateNav — Tab avança, sai do componente e mantém aria-live/heading', async ({ page }) => {
  await page.goto('/santos?date=2026-07-20', { waitUntil: 'domcontentloaded' });

  const grupo = page.getByRole('group', { name: 'Navegação por data' });
  await expect(grupo).toBeVisible();

  const heading = page.getByRole('heading', { level: 2 }).first();
  const region = page
    .locator('[aria-live="polite"][aria-atomic="true"]')
    .filter({ has: heading })
    .first();
  await expect(heading).toHaveText(/^20 de julho$/i);
  await expect(region).toHaveAttribute('aria-live', 'polite');
  await expect(region).toHaveAttribute('aria-atomic', 'true');

  // Ponto de partida: primeiro controle acionável do grupo.
  const primeiro = page.getByRole('button', { name: 'Semana anterior' });
  await primeiro.focus();
  await expect(primeiro).toBeFocused();

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

  const dentroDoGrupo = async () =>
    page.evaluate(() => {
      const g = document.querySelector('[role="group"][aria-label="Navegação por data"]');
      return !!g && !!document.activeElement && g.contains(document.activeElement);
    });

  // Coleta a sequência de labels ao pressionar Tab até sair do grupo.
  const sequencia: (string | null)[] = [await focusedLabel()];
  const MAX_STEPS = 40;
  let saiu = false;
  for (let i = 0; i < MAX_STEPS; i++) {
    await page.keyboard.press('Tab');
    sequencia.push(await focusedLabel());
    if (!(await dentroDoGrupo())) {
      saiu = true;
      break;
    }
  }
  expect(saiu, 'Tab deveria eventualmente sair do SanctorumDateNav').toBe(true);

  // Ordem relativa esperada dos controles principais ao avançar com Tab.
  const esperados = [
    'Semana anterior',
    'Dia anterior',
    'Próximo dia',
    'Próxima semana',
    'Ir para hoje',
    'Escolher data no calendário',
  ];
  const labels = sequencia.filter((l): l is string => !!l);
  let cursor = 0;
  for (const alvo of esperados) {
    const idx = labels.indexOf(alvo, cursor);
    expect(
      idx,
      `esperava ${alvo} após posição ${cursor} em ${JSON.stringify(labels)}`,
    ).toBeGreaterThanOrEqual(cursor);
    cursor = idx + 1;
  }

  // O heading e a região aria-live permanecem íntegros após o percurso.
  await expect(heading).toHaveText(/^20 de julho$/i);
  await expect(region).toHaveAttribute('aria-live', 'polite');
  await expect(region).toHaveAttribute('aria-atomic', 'true');

  // Confirma que, após navegar por Tab e ativar um controle via teclado,
  // o heading é reanunciado (aria-live continua funcional).
  const proximo = page.getByRole('button', { name: 'Próximo dia' });
  await proximo.focus();
  await expect(proximo).toBeFocused();
  const antes = (await heading.textContent())?.trim() ?? '';
  await page.keyboard.press('Enter');
  await expect
    .poll(async () => (await heading.textContent())?.trim() ?? '')
    .not.toBe(antes);
  await expect(heading).toHaveText(/^21 de julho$/i);
  await expect(region).toHaveAttribute('aria-live', 'polite');
});
