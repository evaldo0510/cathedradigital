import { test, expect } from '@playwright/test';

/**
 * Seleção atualiza ?date=... e preserva o fragmento (#...). Após reload,
 * a data é restaurada, o fragmento se mantém e não há anúncios duplicados
 * no aria-live.
 */
test('SanctorumDateNav — seleção respeita ?date= e preserva #fragmento', async ({ page }) => {
  await page.goto('/santos?date=2026-07-20#santo-do-dia', {
    waitUntil: 'domcontentloaded',
  });

  const heading = page.getByRole('heading', { level: 2 }).first();
  await expect(heading).toHaveText(/^20 de julho$/i);
  await expect(page).toHaveURL(/date=2026-07-20/);
  await expect(page).toHaveURL(/#santo-do-dia$/);

  // Seleção via pill → ?date= muda, fragmento continua.
  const pill = page.getByRole('button', { name: /22 de julho/i }).first();
  await pill.click();
  await expect(heading).toHaveText(/^22 de julho$/i);
  await expect(page).toHaveURL(/date=2026-07-22/);
  await expect(page).toHaveURL(/#santo-do-dia$/);

  // Seleção via seta → ?date= incrementa, fragmento continua.
  await page.getByRole('button', { name: /próximo dia/i }).click();
  await expect(page).toHaveURL(/date=2026-07-23/);
  await expect(page).toHaveURL(/#santo-do-dia$/);

  // Reload → tudo restaurado.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/date=2026-07-23/);
  await expect(page).toHaveURL(/#santo-do-dia$/);
  const headingAfter = page.getByRole('heading', { level: 2 }).first();
  await expect(headingAfter).toHaveText(/^23 de julho$/i);

  // Observa aria-live pós-hidratação: sem anúncios espontâneos.
  await page.evaluate(() => {
    const region = document.querySelector('[aria-live="polite"][aria-atomic="true"]');
    (window as unknown as { __a: string[] }).__a = [];
    if (!region) return;
    new MutationObserver(() => {
      const t = (region.textContent ?? '').trim();
      if (t) (window as unknown as { __a: string[] }).__a.push(t);
    }).observe(region, { childList: true, subtree: true, characterData: true });
  });
  await page.waitForTimeout(400);
  const initial = await page.evaluate(
    () => (window as unknown as { __a: string[] }).__a.slice(),
  );
  expect(initial.length).toBe(0);

  // aria-pressed único e correto.
  const selected = page.locator('[role="group"] button[aria-pressed="true"]');
  await expect(selected).toHaveCount(1);
  await expect(selected.first()).toHaveAccessibleName(/23 de julho/i);
});
