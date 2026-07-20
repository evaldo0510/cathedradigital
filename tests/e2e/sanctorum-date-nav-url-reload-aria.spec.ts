import { test, expect } from '@playwright/test';

/**
 * Persistência URL + reload:
 *  Selecionar (pill/setas) atualiza ?date=YYYY-MM-DD.
 *  Reload restaura data, heading pt-BR e aria-pressed único,
 *  sem gerar anúncios duplicados no aria-live após a hidratação.
 */
test('SanctorumDateNav — URL reflete seleção e reload restaura estado sem anúncios duplicados', async ({ page }) => {
  await page.goto('/santos?date=2026-07-20', { waitUntil: 'domcontentloaded' });
  const heading = page.getByRole('heading', { level: 2 }).first();
  await expect(heading).toHaveText(/^20 de julho$/i);
  await expect(page).toHaveURL(/date=2026-07-20/);

  // Seleciona nova data via pill
  const pill = page.getByRole('button', { name: /23 de julho/i }).first();
  await pill.click();
  await expect(page).toHaveURL(/date=2026-07-23/);
  await expect(heading).toHaveText(/^23 de julho$/i);
  await expect(pill).toHaveAttribute('aria-pressed', 'true');

  // Avança 1 dia via seta → URL persiste
  await page.getByRole('button', { name: /próximo dia/i }).click();
  await expect(page).toHaveURL(/date=2026-07-24/);
  await expect(heading).toHaveText(/^24 de julho$/i);

  // Reload → estado restaurado
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/date=2026-07-24/);

  const headingAfter = page.getByRole('heading', { level: 2 }).first();
  await expect(headingAfter).toHaveText(/^24 de julho$/i);

  // Região aria-live com atributos corretos
  const region = page
    .locator('[aria-live="polite"][aria-atomic="true"]')
    .filter({ has: headingAfter })
    .first();
  await expect(region).toHaveAttribute('aria-live', 'polite');
  await expect(region).toHaveAttribute('aria-atomic', 'true');

  // aria-pressed único apontando para 24 de julho
  const selected = page.locator('[role="group"] button[aria-pressed="true"]');
  await expect(selected).toHaveCount(1);
  await expect(selected.first()).toHaveAccessibleName(/24 de julho/i);

  // Observa anúncios pós-hidratação
  await page.evaluate(() => {
    const region = document.querySelector('[aria-live="polite"][aria-atomic="true"]');
    (window as unknown as { __a: string[] }).__a = [];
    if (!region) return;
    new MutationObserver(() => {
      const t = (region.textContent ?? '').trim();
      if (t) (window as unknown as { __a: string[] }).__a.push(t);
    }).observe(region, { childList: true, subtree: true, characterData: true });
  });

  // Aguarda janela de possíveis efeitos assentarem
  await page.waitForTimeout(400);

  // Nenhuma mudança de data foi feita → nenhum anúncio deve surgir
  const initial = await page.evaluate(
    () => (window as unknown as { __a: string[] }).__a.slice(),
  );
  expect(initial.length).toBe(0);

  // Uma nova seleção deve gerar exatamente 1 anúncio, sem duplicidade consecutiva
  await page.getByRole('button', { name: /próximo dia/i }).click();
  await expect(headingAfter).toHaveText(/^25 de julho$/i);
  await page.waitForTimeout(200);
  const after = await page.evaluate(
    () => (window as unknown as { __a: string[] }).__a.slice(),
  );
  expect(after.length).toBe(1);
  expect(after[0]).toMatch(/25 de julho/i);

  // Reload novamente e verifica que 25 persiste
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/date=2026-07-25/);
  await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText(/^25 de julho$/i);
  await expect(
    page.locator('[role="group"] button[aria-pressed="true"]').first(),
  ).toHaveAccessibleName(/25 de julho/i);
});
