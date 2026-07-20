import { test, expect, devices } from '@playwright/test';

/**
 * Rolagem horizontal da tira de pills:
 *  Após rolar, o pill focado deve manter o foco (activeElement) e o heading
 *  permanecer consistente com a data selecionada, sem truncamento visual.
 */
test.use({ viewport: { width: 375, height: 812 } });

test('SanctorumDateNav — rolar pills preserva foco, heading e seleção', async ({ page }) => {
  await page.goto('/santos?date=2026-07-20', { waitUntil: 'domcontentloaded' });

  const strip = page.locator('[role="group"]').filter({ has: page.locator('button[aria-pressed]') }).first();
  await expect(strip).toBeVisible();

  const selected = strip.locator('button[aria-pressed="true"]').first();
  await selected.focus();
  const beforeName = await selected.getAttribute('aria-label');

  // Rola horizontalmente a tira
  await strip.evaluate((el) => {
    (el as HTMLElement).scrollBy({ left: 200, behavior: 'instant' as ScrollBehavior });
  });
  await page.waitForTimeout(150);

  // Foco preservado no pill selecionado
  const focusedName = await page.evaluate(
    () => document.activeElement?.getAttribute('aria-label') ?? null,
  );
  expect(focusedName).toBe(beforeName);

  // Heading permanece consistente
  await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText(/^20 de julho$/i);

  // Sem truncamento: cada pill visível cabe dentro do container (não estoura em altura)
  const containerBox = await strip.boundingBox();
  const pillBoxes = await strip.locator('button[aria-label*="de "]').evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, width: r.width };
    }),
  );
  expect(containerBox).not.toBeNull();
  for (const box of pillBoxes) {
    // Não pode ter overflow vertical (todos os pills alinhados na tira)
    expect(box.bottom - box.top).toBeLessThanOrEqual((containerBox!.height ?? 0) + 4);
    expect(box.width).toBeGreaterThan(20);
  }

  // Ainda existe exatamente 1 seleção
  await expect(strip.locator('button[aria-pressed="true"]')).toHaveCount(1);
});
