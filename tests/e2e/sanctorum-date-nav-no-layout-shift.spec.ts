import { test, expect } from '@playwright/test';

/**
 * Garante que a troca de data via setas / Hoje / pills não provoca layout
 * shift perceptível no bloco do heading (aria-live). Medimos a bounding box
 * antes/depois de cada interação e confirmamos que altura e topo mantêm-se
 * estáveis (tolerância ≤ 2px para arredondamentos do subpixel).
 */
test('SanctorumDateNav — troca de data não causa salto de layout', async ({ page }) => {
  await page.goto('/santos?date=2026-07-20', { waitUntil: 'domcontentloaded' });

  const heading = page.getByRole('heading', { level: 2 }).first();
  const region = page.locator('[aria-live="polite"][aria-atomic="true"]').filter({ has: heading }).first();
  await expect(region).toBeVisible();

  const snap = async () => {
    const b = await region.boundingBox();
    if (!b) throw new Error('região sem bounding box');
    return b;
  };

  const base = await snap();

  const dentroDaTolerancia = (a: number, b: number, tol = 2) => Math.abs(a - b) <= tol;

  // Próximo dia
  await page.getByRole('button', { name: 'Próximo dia' }).click();
  await expect(heading).not.toHaveText('20 de julho');
  let atual = await snap();
  expect(dentroDaTolerancia(atual.height, base.height)).toBe(true);
  expect(dentroDaTolerancia(atual.y, base.y)).toBe(true);

  // Dia anterior
  await page.getByRole('button', { name: 'Dia anterior' }).click();
  await expect(heading).toHaveText(/^20 de julho$/i);
  atual = await snap();
  expect(dentroDaTolerancia(atual.height, base.height)).toBe(true);
  expect(dentroDaTolerancia(atual.y, base.y)).toBe(true);

  // Hoje
  await page.getByRole('button', { name: 'Ir para hoje' }).click();
  atual = await snap();
  expect(dentroDaTolerancia(atual.height, base.height)).toBe(true);
  expect(dentroDaTolerancia(atual.y, base.y)).toBe(true);

  // Pill
  const pills = page.getByTestId('sanctorum-date-strip').locator('button');
  await pills.first().click();
  atual = await snap();
  expect(dentroDaTolerancia(atual.height, base.height)).toBe(true);
  expect(dentroDaTolerancia(atual.y, base.y)).toBe(true);

  // aria-live segue ativo ao final
  await expect(region).toHaveAttribute('aria-live', 'polite');
});
