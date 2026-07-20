import { test, expect } from '@playwright/test';

/**
 * Cliques/teclas rápidas em sequência:
 *  - N cliques em "Próximo dia" seguidos de M cliques em "Dia anterior"
 *  - O heading final deve corresponder EXATAMENTE à data resultante
 *    (base + (N - M) dias), sem estados intermediários "presos".
 *  - A região aria-live permanece polite/atomic (sem duplicação ou remoção).
 */
test('SanctorumDateNav — cliques rápidos convergem para a data final', async ({ page }) => {
  await page.goto('/santos?date=2026-07-20', { waitUntil: 'domcontentloaded' });
  const heading = page.getByRole('heading', { level: 2 }).first();
  const region = page.locator('[aria-live="polite"][aria-atomic="true"]').filter({ has: heading }).first();
  await expect(heading).toHaveText(/^20 de julho$/i);

  const proximo = page.getByRole('button', { name: 'Próximo dia' });
  const anterior = page.getByRole('button', { name: 'Dia anterior' });

  // 7 avanços + 3 recuos → esperado 24 de julho
  for (let i = 0; i < 7; i++) await proximo.click({ delay: 0 });
  for (let i = 0; i < 3; i++) await anterior.click({ delay: 0 });

  await expect(heading).toHaveText(/^24 de julho$/i);
  await expect(region).toHaveAttribute('aria-live', 'polite');
  await expect(region).toHaveAttribute('aria-atomic', 'true');

  // Repete via teclado: 5 recuos rápidos → 19 de julho
  await anterior.focus();
  for (let i = 0; i < 5; i++) await page.keyboard.press('Enter');
  await expect(heading).toHaveText(/^19 de julho$/i);
  await expect(region).toHaveAttribute('aria-live', 'polite');

  // Deve existir exatamente UMA região aria-live no bloco do heading.
  const regionCount = await page.locator('[aria-live="polite"][aria-atomic="true"]').filter({ has: heading }).count();
  expect(regionCount).toBe(1);
});
