import { test, expect } from '@playwright/test';

/**
 * Botão "Hoje" — teclado + mouse:
 *  Ao acionar via clique e via teclado (Enter/Espaço), a data selecionada
 *  deve ir para o dia atual, o heading em pt-BR deve refletir hoje e o
 *  aria-live deve manter os atributos polite/atomic sem duplicidade.
 */
test('SanctorumDateNav — botão Hoje via teclado e mouse volta para hoje', async ({ page }) => {
  // Formata hoje em pt-BR: "dd de MMMM"
  const today = new Date();
  const months = [
    'janeiro','fevereiro','março','abril','maio','junho',
    'julho','agosto','setembro','outubro','novembro','dezembro',
  ];
  const dd = String(today.getDate()).padStart(2, '0');
  const todayLabel = new RegExp(`^${dd} de ${months[today.getMonth()]}$`, 'i');
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${dd}`;

  // Começa em data distinta de hoje
  await page.goto('/santos?date=2026-01-15', { waitUntil: 'domcontentloaded' });
  const heading = page.getByRole('heading', { level: 2 }).first();
  await expect(heading).toHaveText(/^15 de janeiro$/i);

  const region = page
    .locator('[aria-live="polite"][aria-atomic="true"]')
    .filter({ has: heading })
    .first();

  // Instrumenta anúncios do aria-live
  await page.evaluate(() => {
    const region = document.querySelector(
      '[aria-live="polite"][aria-atomic="true"]',
    );
    (window as unknown as { __ann: string[] }).__ann = [];
    if (!region) return;
    new MutationObserver(() => {
      const text = (region.textContent ?? '').trim();
      if (text) (window as unknown as { __ann: string[] }).__ann.push(text);
    }).observe(region, { childList: true, subtree: true, characterData: true });
  });

  // Mouse
  const hoje = page.getByRole('button', { name: /^hoje$/i });
  await hoje.click();
  await expect(page).toHaveURL(new RegExp(`date=${todayISO}`));
  await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText(todayLabel);
  await expect(region).toHaveAttribute('aria-live', 'polite');
  await expect(region).toHaveAttribute('aria-atomic', 'true');

  // Sai de hoje para testar via teclado
  await page.getByRole('button', { name: /próximo dia/i }).click();
  await expect(page.getByRole('heading', { level: 2 }).first()).not.toHaveText(todayLabel);

  // Teclado: Enter
  await hoje.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(`date=${todayISO}`));
  await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText(todayLabel);

  // Sai de novo e usa Space
  await page.getByRole('button', { name: /dia anterior/i }).click();
  await hoje.focus();
  await page.keyboard.press('Space');
  await expect(page).toHaveURL(new RegExp(`date=${todayISO}`));
  await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText(todayLabel);

  // Sem duplicidades consecutivas
  const anns = await page.evaluate(
    () => (window as unknown as { __ann: string[] }).__ann,
  );
  for (let i = 1; i < anns.length; i++) {
    expect(anns[i]).not.toBe(anns[i - 1]);
  }
});
