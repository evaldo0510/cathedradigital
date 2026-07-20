import { test, expect } from '@playwright/test';

/**
 * Home/End na tira de dias do SanctorumDateNav:
 *  - Home salta para a primeira pill visível (data mais antiga da tira).
 *  - End salta para a última pill visível (data mais recente da tira).
 *  - O heading é atualizado com o texto da pill selecionada e aria-live
 *    continua polite/atomic.
 */
test('SanctorumDateNav — Home/End saltam para início/fim da tira', async ({ page }) => {
  await page.goto('/santos?date=2026-07-20', { waitUntil: 'domcontentloaded' });

  const heading = page.getByRole('heading', { level: 2 }).first();
  const region = page
    .locator('[aria-live="polite"][aria-atomic="true"]')
    .filter({ has: heading })
    .first();
  await expect(heading).toHaveText(/^20 de julho$/i);

  const strip = page.getByTestId('sanctorum-date-strip');
  const pills = strip.locator('button');
  const total = await pills.count();
  expect(total).toBeGreaterThanOrEqual(7);

  const firstLabel = (await pills.first().getAttribute('aria-label')) ?? '';
  const lastLabel = (await pills.nth(total - 1).getAttribute('aria-label')) ?? '';
  expect(firstLabel).toMatch(/^\d{2} de [a-zçãé]+$/i);
  expect(lastLabel).toMatch(/^\d{2} de [a-zçãé]+$/i);

  // Foca uma pill do meio para exercitar Home/End a partir da tira.
  await pills.nth(3).focus();
  await expect(pills.nth(3)).toBeFocused();

  // Home → heading espelha a primeira pill
  await page.keyboard.press('Home');
  await expect
    .poll(async () => (await heading.textContent())?.trim().toLowerCase() ?? '')
    .toBe(firstLabel.toLowerCase());
  await expect(region).toHaveAttribute('aria-live', 'polite');
  await expect(region).toHaveAttribute('aria-atomic', 'true');

  // Após Home, foca novamente a tira e testa End (a tira re-renderiza com nova âncora,
  // então recapturamos as pills e o label esperado da última posição).
  const stripApósHome = page.getByTestId('sanctorum-date-strip');
  const pillsApósHome = stripApósHome.locator('button');
  await pillsApósHome.nth(3).focus();
  const novoLastLabel = (await pillsApósHome.nth((await pillsApósHome.count()) - 1).getAttribute('aria-label')) ?? '';

  await page.keyboard.press('End');
  await expect
    .poll(async () => (await heading.textContent())?.trim().toLowerCase() ?? '')
    .toBe(novoLastLabel.toLowerCase());
  await expect(region).toHaveAttribute('aria-live', 'polite');
});
