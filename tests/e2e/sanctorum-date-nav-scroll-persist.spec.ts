import { test, expect } from '@playwright/test';

/**
 * Após selecionar uma data e recarregar, a tira de pills preserva a posição
 * de rolagem (a pill selecionada continua visível), o foco visível é
 * restaurado ao interagir e a seleção correta é mantida.
 */
test('SanctorumDateNav — reload preserva scroll/foco/seleção da tira', async ({ page }) => {
  await page.goto('/santos?date=2026-07-20', { waitUntil: 'domcontentloaded' });

  const strip = page.getByTestId('sanctorum-date-strip');
  await expect(strip).toBeVisible();

  // Rola a tira até o fim para forçar uma posição não-zero.
  await strip.evaluate((el) => {
    el.scrollLeft = el.scrollWidth;
  });
  await page.waitForTimeout(100);

  // Seleciona a última pill visível (posição rolada).
  const pills = strip.locator('button');
  const total = await pills.count();
  expect(total).toBeGreaterThan(3);
  const target = pills.nth(total - 1);
  const label = ((await target.getAttribute('aria-label')) ?? '').trim();
  expect(label).not.toBe('');
  await target.click();

  await expect(target).toHaveAttribute('aria-pressed', 'true');
  const heading = page.getByRole('heading', { level: 2 }).first();
  await expect(heading).toHaveText(new RegExp(`^${label}$`, 'i'));

  // Reload
  await page.reload({ waitUntil: 'domcontentloaded' });
  const stripAfter = page.getByTestId('sanctorum-date-strip');
  await expect(stripAfter).toBeVisible();

  // Seleção restaurada
  const selected = page.locator('[role="group"] button[aria-pressed="true"]');
  await expect(selected).toHaveCount(1);
  await expect(selected.first()).toHaveAccessibleName(new RegExp(label, 'i'));

  // Pill selecionada visível dentro do viewport da tira (scroll preservado).
  const visible = await stripAfter.evaluate((el, sel) => {
    const chosen = el.querySelector(sel) as HTMLElement | null;
    if (!chosen) return false;
    const c = el.getBoundingClientRect();
    const b = chosen.getBoundingClientRect();
    return b.right > c.left && b.left < c.right;
  }, 'button[aria-pressed="true"]');
  expect(visible, 'pill selecionada deve permanecer visível na tira').toBe(true);

  // Foco visível ao focar a pill selecionada.
  await selected.first().focus();
  const focusOk = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return false;
    const cs = getComputedStyle(el);
    const outline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth || '0') > 0;
    const shadow = cs.boxShadow !== 'none' && cs.boxShadow.length > 0;
    const cls = (el.className || '').toString();
    return outline || shadow || cls.includes('ring') || cls.includes('focus-visible');
  });
  expect(focusOk, 'pill selecionada deve exibir foco visível').toBe(true);
});
