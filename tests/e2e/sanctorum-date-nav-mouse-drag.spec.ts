import { test, expect } from '@playwright/test';

/**
 * Drag com mouse na tira (mobile viewport):
 *  Arrasta a tira com mouse, depois clica em um pill visível.
 *  Verifica seleção correta, heading pt-BR e 1 anúncio único no aria-live.
 */
test.use({ viewport: { width: 375, height: 812 } });

test('SanctorumDateNav — mouse drag + click seleciona data e anuncia 1 vez', async ({ page }) => {
  await page.goto('/santos?date=2026-07-20', { waitUntil: 'domcontentloaded' });
  const heading = page.getByRole('heading', { level: 2 }).first();
  await expect(heading).toHaveText(/^20 de julho$/i);

  const strip = page
    .locator('[role="group"]')
    .filter({ has: page.locator('button[aria-pressed]') })
    .first();
  const box = await strip.boundingBox();
  if (!box) throw new Error('sem bounding box');

  // Drag horizontal com mouse (não deve selecionar sozinho)
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width - 30, y);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) {
    const x = box.x + box.width - 30 - ((box.width - 60) * i) / 10;
    await page.mouse.move(x, y, { steps: 2 });
  }
  await page.mouse.up();
  await page.waitForTimeout(150);

  // Instrumenta aria-live
  await page.evaluate(() => {
    const region = document.querySelector('[aria-live="polite"][aria-atomic="true"]');
    (window as unknown as { __a: string[] }).__a = [];
    if (!region) return;
    new MutationObserver(() => {
      const t = (region.textContent ?? '').trim();
      if (t) (window as unknown as { __a: string[] }).__a.push(t);
    }).observe(region, { childList: true, subtree: true, characterData: true });
  });

  // Escolhe um pill visível não selecionado
  const target = page
    .locator('[role="group"] button[aria-label*="de julho"]:not([aria-pressed="true"])')
    .first();
  const label = await target.getAttribute('aria-label');
  const dd = String(label!.match(/^(\d{1,2}) de julho/i)![1]).padStart(2, '0');

  await target.click();
  await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText(
    new RegExp(`^${dd} de julho$`, 'i'),
  );
  await expect(page).toHaveURL(new RegExp(`date=2026-07-${dd}`));

  await page.waitForTimeout(200);
  const anns = await page.evaluate(() => (window as unknown as { __a: string[] }).__a.slice());
  expect(anns.length).toBe(1);
  expect(anns[0]).toMatch(new RegExp(`${dd} de julho`, 'i'));
});
