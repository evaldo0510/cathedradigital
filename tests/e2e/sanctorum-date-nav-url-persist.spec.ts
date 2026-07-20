import { test, expect } from '@playwright/test';

/**
 * SanctorumDateNav — URL persistence:
 *  Ao selecionar uma data (via pill / setas / Hoje) a query `?date=YYYY-MM-DD`
 *  deve ser atualizada. Após reload, o heading e a pill com aria-pressed="true"
 *  devem continuar refletindo a data escolhida.
 */
test('SanctorumDateNav — seleção atualiza URL e persiste após reload', async ({ page }) => {
  await page.goto('/santos?date=2026-07-20', { waitUntil: 'domcontentloaded' });

  const heading = page.getByRole('heading', { level: 2 }).first();
  await expect(heading).toHaveText(/^20 de julho$/i);
  await expect(page).toHaveURL(/date=2026-07-20/);

  // Avança 1 dia via botão "Próximo dia" → URL deve refletir 2026-07-21.
  await page.getByRole('button', { name: /próximo dia/i }).click();
  await expect(page).toHaveURL(/date=2026-07-21/);
  await expect(heading).toHaveText(/^21 de julho$/i);

  // Clica numa pill específica da tira (ex.: 24) e valida URL.
  const pill24 = page.getByRole('button', { name: /24 de julho/i }).first();
  await pill24.click();
  await expect(page).toHaveURL(/date=2026-07-24/);
  await expect(heading).toHaveText(/^24 de julho$/i);
  await expect(pill24).toHaveAttribute('aria-pressed', 'true');

  // Reload → estado persiste (URL, heading e pill selecionada).
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/date=2026-07-24/);
  const headingAfter = page.getByRole('heading', { level: 2 }).first();
  await expect(headingAfter).toHaveText(/^24 de julho$/i);

  const selectedPills = page.locator('[role="group"] button[aria-pressed="true"]');
  await expect(selectedPills).toHaveCount(1);
  await expect(selectedPills.first()).toHaveAccessibleName(/24 de julho/i);

  // Semana seguinte → URL avança 7 dias e persiste no reload.
  await page.getByRole('button', { name: /próxima semana/i }).click();
  await expect(page).toHaveURL(/date=2026-07-31/);
  await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText(/^31 de julho$/i);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/date=2026-07-31/);
  await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText(/^31 de julho$/i);
  const persistedPill = page.locator('[role="group"] button[aria-pressed="true"]').first();
  await expect(persistedPill).toHaveAccessibleName(/31 de julho/i);
});
