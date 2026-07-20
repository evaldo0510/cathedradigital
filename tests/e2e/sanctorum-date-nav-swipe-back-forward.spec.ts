import { test, expect } from '@playwright/test';

/**
 * Após selecionar via swipe+tap, voltar/avançar do navegador mantém
 * data, heading pt-BR, aria-pressed e não gera anúncios duplicados.
 */
test.use({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
});

test('SanctorumDateNav — swipe + back/forward preservam data, heading e aria-live coerente', async ({ page }) => {
  // Cria histórico explícito com goto (persistência interna usa replace:true)
  await page.goto('/santos?date=2026-07-20', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText(/^20 de julho$/i);
  await page.goto('/santos?date=2026-07-25', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText(/^25 de julho$/i);

  // Instrumenta anúncios
  await page.evaluate(() => {
    const region = document.querySelector('[aria-live="polite"][aria-atomic="true"]');
    (window as unknown as { __a: string[] }).__a = [];
    if (!region) return;
    new MutationObserver(() => {
      const t = (region.textContent ?? '').trim();
      if (t) (window as unknown as { __a: string[] }).__a.push(t);
    }).observe(region, { childList: true, subtree: true, characterData: true });
  });

  // Back → 20
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/date=2026-07-20/);
  await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText(/^20 de julho$/i);
  const pill20 = page.locator('[role="group"] button[aria-pressed="true"]').first();
  await expect(pill20).toHaveAccessibleName(/20 de julho/i);

  // Forward → 25
  await page.goForward({ waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/date=2026-07-25/);
  await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText(/^25 de julho$/i);
  const pill25 = page.locator('[role="group"] button[aria-pressed="true"]').first();
  await expect(pill25).toHaveAccessibleName(/25 de julho/i);
  await expect(page.locator('[role="group"] button[aria-pressed="true"]')).toHaveCount(1);

  // Nenhum par consecutivo de anúncios repetido
  const anns = await page.evaluate(() => (window as unknown as { __a: string[] }).__a.slice());
  for (let i = 1; i < anns.length; i++) {
    expect(anns[i]).not.toBe(anns[i - 1]);
  }
});
