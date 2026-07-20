import { test, expect } from '@playwright/test';

/**
 * Foco visível (:focus-visible) em Tab/Shift+Tab, desktop e mobile.
 * Verifica que cada controle recebe outline/box-shadow/ring perceptível.
 */
const CONTROL_NAMES = [
  /calendário/i,
  /^hoje$/i,
  /semana anterior/i,
  /próxima semana/i,
  /dia anterior/i,
  /próximo dia/i,
];

async function hasVisibleFocusStyle(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return { ok: false, reason: 'no-active' };
    const cs = getComputedStyle(el);
    const outlineOk =
      cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth || '0') > 0;
    const shadowOk = cs.boxShadow !== 'none' && cs.boxShadow.length > 0;
    const ringOk =
      (el.className || '').toString().includes('ring') ||
      (el.className || '').toString().includes('focus-visible');
    return {
      ok: outlineOk || shadowOk || ringOk,
      outline: cs.outline,
      boxShadow: cs.boxShadow,
      cls: el.className?.toString?.() ?? '',
    };
  });
}

async function auditFocusOrder(page: import('@playwright/test').Page) {
  for (const name of CONTROL_NAMES) {
    const btn = page.getByRole('button', { name }).first();
    if (!(await btn.count())) continue;
    await btn.focus();
    const info = await hasVisibleFocusStyle(page);
    expect(
      info.ok,
      `Controle ${name} sem foco visível (outline=${info.outline}, shadow=${info.boxShadow})`,
    ).toBeTruthy();
  }

  // Também percorre Tab natural
  await page.getByRole('button', { name: /calendário/i }).focus();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    const info = await hasVisibleFocusStyle(page);
    expect(info.ok, `Foco invisível após Tab #${i + 1}`).toBeTruthy();
  }

  // E Shift+Tab reverso
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Shift+Tab');
    const info = await hasVisibleFocusStyle(page);
    expect(info.ok, `Foco invisível após Shift+Tab #${i + 1}`).toBeTruthy();
  }
}

test.describe('SanctorumDateNav — foco visível em Tab/Shift+Tab', () => {
  test('Desktop 1280x800', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await page.goto('/santos?date=2026-07-20', { waitUntil: 'domcontentloaded' });
    await auditFocusOrder(page);
    await ctx.close();
  });

  test('Mobile iPhone SE 375x667', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 667 } });
    const page = await ctx.newPage();
    await page.goto('/santos?date=2026-07-20', { waitUntil: 'domcontentloaded' });
    await auditFocusOrder(page);
    await ctx.close();
  });
});
