import { test, expect, devices } from '@playwright/test';

/**
 * Navegação por teclado do SanctorumDateNav em viewport móvel (iPhone SE):
 *  - Foco visível permanece dentro do componente.
 *  - Heading atualiza após Enter/Space nos controles.
 *  - Sem truncamento vertical (heading não é cortado) nem sobreposição
 *    com a tira de dias (bounding boxes não colidem).
 *  - aria-live continua polite/atomic durante toda a jornada.
 */
test.use({ ...devices['iPhone SE'] });

test('SanctorumDateNav — teclado em mobile mantém foco/heading sem overlap', async ({ page }) => {
  await page.goto('/santos?date=2026-07-20', { waitUntil: 'domcontentloaded' });

  const heading = page.getByRole('heading', { level: 2 }).first();
  const region = page
    .locator('[aria-live="polite"][aria-atomic="true"]')
    .filter({ has: heading })
    .first();
  const strip = page.getByTestId('sanctorum-date-strip');

  await expect(heading).toBeVisible();
  await expect(strip).toBeVisible();
  await expect(heading).toHaveText(/^20 de julho$/i);

  const proximo = page.getByRole('button', { name: 'Próximo dia' });
  await proximo.focus();
  await expect(proximo).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(heading).toHaveText(/^21 de julho$/i);
  await expect(proximo).toBeFocused();

  const anterior = page.getByRole('button', { name: 'Dia anterior' });
  await anterior.focus();
  await page.keyboard.press('Space');
  await expect(heading).toHaveText(/^20 de julho$/i);

  // Ativa uma pill via teclado
  const pills = strip.locator('button');
  await pills.nth(5).focus();
  await expect(pills.nth(5)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect
    .poll(async () => (await heading.textContent())?.trim() ?? '')
    .not.toBe('20 de julho');

  // aria-live intacto
  await expect(region).toHaveAttribute('aria-live', 'polite');
  await expect(region).toHaveAttribute('aria-atomic', 'true');

  // Sem truncamento do heading (scrollHeight <= clientHeight + 1 tolerância).
  const truncated = await heading.evaluate((el) => el.scrollHeight > el.clientHeight + 2);
  expect(truncated, 'heading não pode estar truncado verticalmente').toBe(false);

  // Sem sobreposição entre heading e tira de dias
  const hBox = await heading.boundingBox();
  const sBox = await strip.boundingBox();
  expect(hBox && sBox).toBeTruthy();
  if (hBox && sBox) {
    const overlapY = Math.min(hBox.y + hBox.height, sBox.y + sBox.height) - Math.max(hBox.y, sBox.y);
    const overlapX = Math.min(hBox.x + hBox.width, sBox.x + sBox.width) - Math.max(hBox.x, sBox.x);
    const overlap = overlapX > 0 && overlapY > 0;
    expect(overlap, `heading e tira não podem se sobrepor (h=${JSON.stringify(hBox)}, s=${JSON.stringify(sBox)})`).toBe(false);
  }
});
