import { test, expect } from '@playwright/test';

/**
 * Interação por mouse no SanctorumDateNav:
 *  - Clicar em "Próximo dia", "Dia anterior" e pills da tira atualiza o heading.
 *  - Cada troca produz UM único anúncio no aria-live (sem duplicidades),
 *    ou seja: cada texto distinto aparece exatamente uma vez na sequência.
 */
test('SanctorumDateNav — cliques do mouse atualizam heading sem duplicar anúncios', async ({ page }) => {
  await page.goto('/santos?date=2026-07-20', { waitUntil: 'domcontentloaded' });

  const heading = page.getByRole('heading', { level: 2 }).first();
  const region = page
    .locator('[aria-live="polite"][aria-atomic="true"]')
    .filter({ has: heading })
    .first();
  await expect(heading).toHaveText(/^20 de julho$/i);
  await expect(region).toHaveAttribute('aria-live', 'polite');
  await expect(region).toHaveAttribute('aria-atomic', 'true');

  // Observa mutações no texto do heading para detectar cada anúncio emitido.
  await page.evaluate(() => {
    const el = document.querySelector('h2') as HTMLElement | null;
    if (!el) return;
    (window as any).__anuncios = [] as string[];
    const push = (t: string) => {
      const arr = (window as any).__anuncios as string[];
      if (arr[arr.length - 1] !== t) arr.push(t);
    };
    push(el.textContent?.trim() ?? '');
    const obs = new MutationObserver(() => push(el.textContent?.trim() ?? ''));
    obs.observe(el, { childList: true, characterData: true, subtree: true });
  });

  const proximo = page.getByRole('button', { name: 'Próximo dia' });
  const anterior = page.getByRole('button', { name: 'Dia anterior' });
  const pills = page.getByTestId('sanctorum-date-strip').locator('button');

  await proximo.click();
  await expect(heading).toHaveText(/^21 de julho$/i);
  await proximo.click();
  await expect(heading).toHaveText(/^22 de julho$/i);
  await anterior.click();
  await expect(heading).toHaveText(/^21 de julho$/i);

  // Clicar numa pill diferente da atual e verificar espelhamento do label.
  const total = await pills.count();
  let pickedLabel = '';
  const atual = ((await heading.textContent()) ?? '').trim().toLowerCase();
  for (let i = 0; i < total; i++) {
    const lbl = ((await pills.nth(i).getAttribute('aria-label')) ?? '').toLowerCase();
    if (lbl && lbl !== atual) {
      pickedLabel = lbl;
      await pills.nth(i).click();
      break;
    }
  }
  expect(pickedLabel).not.toBe('');
  await expect
    .poll(async () => ((await heading.textContent()) ?? '').trim().toLowerCase())
    .toBe(pickedLabel);

  // Consistência dos anúncios: sem duplicidades consecutivas e sem repetição
  // do MESMO texto em posições não-adjacentes (cada estado é único na jornada).
  const anuncios = (await page.evaluate(() => (window as any).__anuncios as string[])) ?? [];
  expect(anuncios.length).toBeGreaterThanOrEqual(4);
  for (let i = 1; i < anuncios.length; i++) {
    expect(anuncios[i], `duplicidade consecutiva em ${JSON.stringify(anuncios)}`).not.toBe(anuncios[i - 1]);
  }
  expect(new Set(anuncios).size, `esperava anúncios únicos: ${JSON.stringify(anuncios)}`).toBe(anuncios.length);

  // aria-live permanece ativo ao final.
  await expect(region).toHaveAttribute('aria-live', 'polite');
  await expect(region).toHaveAttribute('aria-atomic', 'true');
});
