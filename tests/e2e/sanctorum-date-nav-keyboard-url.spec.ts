import { test, expect } from '@playwright/test';

/**
 * Teclado (setas + Enter/Espaço) atualiza URL, heading pt-BR e aria-pressed
 * sem gerar anúncios duplicados no aria-live.
 */
test('SanctorumDateNav — teclado atualiza URL, heading e aria-pressed sem duplicidade', async ({ page }) => {
  await page.goto('/santos?date=2026-07-20', { waitUntil: 'domcontentloaded' });

  const heading = page.getByRole('heading', { level: 2 }).first();
  await expect(heading).toHaveText(/^20 de julho$/i);
  await expect(page).toHaveURL(/date=2026-07-20/);

  // Observa anúncios do aria-live
  await page.evaluate(() => {
    const region = document.querySelector('[aria-live="polite"][aria-atomic="true"]');
    (window as unknown as { __a: string[] }).__a = [];
    if (!region) return;
    new MutationObserver(() => {
      const t = (region.textContent ?? '').trim();
      if (t) (window as unknown as { __a: string[] }).__a.push(t);
    }).observe(region, { childList: true, subtree: true, characterData: true });
  });
  const snap = async () =>
    page.evaluate(() => (window as unknown as { __a: string[] }).__a.slice());

  // Enter em "Próximo dia" → 21/07
  const proximo = page.getByRole('button', { name: /próximo dia/i });
  await proximo.focus();
  await page.keyboard.press('Enter');
  await expect(heading).toHaveText(/^21 de julho$/i);
  await expect(page).toHaveURL(/date=2026-07-21/);
  await page.waitForTimeout(120);
  let anns = await snap();
  expect(anns.length).toBe(1);
  expect(anns.at(-1)).toMatch(/21 de julho/i);

  // Space em "Próxima semana" → 28/07
  const semana = page.getByRole('button', { name: /próxima semana/i });
  await semana.focus();
  await page.keyboard.press('Space');
  await expect(heading).toHaveText(/^28 de julho$/i);
  await expect(page).toHaveURL(/date=2026-07-28/);
  await page.waitForTimeout(120);
  anns = await snap();
  expect(anns.length).toBe(2);

  // Enter em pill específica (26 de julho) → URL, heading e aria-pressed
  const pill = page.getByRole('button', { name: /26 de julho/i }).first();
  await pill.focus();
  await page.keyboard.press('Enter');
  await expect(heading).toHaveText(/^26 de julho$/i);
  await expect(page).toHaveURL(/date=2026-07-26/);
  await expect(pill).toHaveAttribute('aria-pressed', 'true');
  const selected = page.locator('[role="group"] button[aria-pressed="true"]');
  await expect(selected).toHaveCount(1);

  await page.waitForTimeout(150);
  anns = await snap();
  expect(anns.length).toBe(3);

  // Nenhum par consecutivo pode ser igual
  for (let i = 1; i < anns.length; i++) {
    expect(anns[i]).not.toBe(anns[i - 1]);
  }
});
