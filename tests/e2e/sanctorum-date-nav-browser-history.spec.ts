import { test, expect } from '@playwright/test';

/**
 * Voltar/avançar do navegador no SanctorumDateNav:
 *  A persistência interna usa `replace: true`, portanto criamos as entradas
 *  de histórico via `page.goto` explícitos (que empilham no history stack).
 *  Depois, `page.goBack()` / `page.goForward()` devem manter o heading em pt-BR
 *  correto para cada data, com aria-live polite/atomic ativo.
 */
test('SanctorumDateNav — back/forward do navegador mantém heading e aria-live', async ({ page }) => {
  await page.goto('/santos?date=2026-07-20', { waitUntil: 'domcontentloaded' });
  const heading = page.getByRole('heading', { level: 2 }).first();
  const region = page
    .locator('[aria-live="polite"][aria-atomic="true"]')
    .filter({ has: heading })
    .first();
  await expect(heading).toHaveText(/^20 de julho$/i);

  await page.goto('/santos?date=2026-08-15', { waitUntil: 'domcontentloaded' });
  await expect(heading).toHaveText(/^15 de agosto$/i);
  await expect(region).toHaveAttribute('aria-live', 'polite');

  await page.goto('/santos?date=2027-01-01', { waitUntil: 'domcontentloaded' });
  await expect(heading).toHaveText(/^01 de janeiro$/i);
  await expect(region).toHaveAttribute('aria-atomic', 'true');

  // Back → 2026-08-15
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/date=2026-08-15/);
  await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText(/^15 de agosto$/i);
  await expect(
    page
      .locator('[aria-live="polite"][aria-atomic="true"]')
      .filter({ has: page.getByRole('heading', { level: 2 }).first() })
      .first(),
  ).toHaveAttribute('aria-live', 'polite');

  // Back → 2026-07-20
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/date=2026-07-20/);
  await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText(/^20 de julho$/i);

  // Forward → 2026-08-15 novamente
  await page.goForward({ waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/date=2026-08-15/);
  const h = page.getByRole('heading', { level: 2 }).first();
  await expect(h).toHaveText(/^15 de agosto$/i);
  const r = page
    .locator('[aria-live="polite"][aria-atomic="true"]')
    .filter({ has: h })
    .first();
  await expect(r).toHaveAttribute('aria-live', 'polite');
  await expect(r).toHaveAttribute('aria-atomic', 'true');

  // Forward → 2027-01-01
  await page.goForward({ waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/date=2027-01-01/);
  await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText(/^01 de janeiro$/i);
});
