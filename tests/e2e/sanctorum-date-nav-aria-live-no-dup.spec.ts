import { test, expect } from '@playwright/test';

/**
 * aria-live sem duplicidades:
 *  Cada interação (setas, pills, Hoje, Enter/Espaço) deve gerar exatamente
 *  UM anúncio único no aria-live, e navegações rápidas consecutivas não
 *  podem emitir mensagens duplicadas iguais em sequência.
 */
test('SanctorumDateNav — aria-live: 1 anúncio por interação, sem duplicidades', async ({ page }) => {
  await page.goto('/santos?date=2026-07-20', { waitUntil: 'domcontentloaded' });
  const heading = page.getByRole('heading', { level: 2 }).first();
  await expect(heading).toHaveText(/^20 de julho$/i);

  // Reset e observação do aria-live
  await page.evaluate(() => {
    const region = document.querySelector(
      '[aria-live="polite"][aria-atomic="true"]',
    );
    (window as unknown as { __a: string[] }).__a = [];
    if (!region) return;
    new MutationObserver(() => {
      const text = (region.textContent ?? '').trim();
      if (text) (window as unknown as { __a: string[] }).__a.push(text);
    }).observe(region, { childList: true, subtree: true, characterData: true });
  });

  const snapshot = async () =>
    page.evaluate(() => (window as unknown as { __a: string[] }).__a.slice());

  // 1) Seta próximo dia
  const before1 = (await snapshot()).length;
  await page.getByRole('button', { name: /próximo dia/i }).click();
  await expect(heading).toHaveText(/^21 de julho$/i);
  await page.waitForTimeout(120);
  const after1 = await snapshot();
  expect(after1.length - before1).toBe(1);
  expect(after1.at(-1)).toMatch(/21 de julho/i);

  // 2) Pill específica
  const before2 = after1.length;
  await page.getByRole('button', { name: /25 de julho/i }).first().click();
  await expect(heading).toHaveText(/^25 de julho$/i);
  await page.waitForTimeout(120);
  const after2 = await snapshot();
  expect(after2.length - before2).toBe(1);

  // 3) Hoje (Enter)
  const before3 = after2.length;
  await page.getByRole('button', { name: /^hoje$/i }).focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(150);
  const after3 = await snapshot();
  expect(after3.length - before3).toBe(1);

  // 4) Space em "próxima semana"
  const before4 = after3.length;
  await page.getByRole('button', { name: /próxima semana/i }).focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(150);
  const after4 = await snapshot();
  expect(after4.length - before4).toBe(1);

  // Navegação rápida: 5 cliques consecutivos em "próximo dia"
  for (let i = 0; i < 5; i++) {
    await page.getByRole('button', { name: /próximo dia/i }).click();
  }
  await page.waitForTimeout(300);
  const finalAnns = await snapshot();

  // Nenhum par consecutivo pode ser igual
  for (let i = 1; i < finalAnns.length; i++) {
    expect(finalAnns[i]).not.toBe(finalAnns[i - 1]);
  }
});
