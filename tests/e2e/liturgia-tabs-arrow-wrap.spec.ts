import { test, expect } from '@playwright/test';

/**
 * Navegação cíclica com ArrowLeft/ArrowRight nas abas da Liturgia,
 * validando wrap (última → primeira e vice-versa) e coerência do
 * roving tabindex após cada troca, em mobile e tablet.
 */

const VIEWPORTS = [
  { name: 'mobile-portrait-390x844', width: 390, height: 844 },
  { name: 'tablet-portrait-768x1024', width: 768, height: 1024 },
];

async function readTabindexes(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('[role="tab"]')).map((el) => el.getAttribute('tabindex')),
  );
}

async function focusedIndex(page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return -1;
    return Array.from(document.querySelectorAll('[role="tab"]')).indexOf(el as Element);
  });
}

async function assertRoving(page, count: number, expected: number, ctx: string) {
  const indexes = await readTabindexes(page);
  const zeros = indexes.filter((v) => v === '0').length;
  expect(zeros, `${ctx} — esperava 1 tabindex=0, got ${JSON.stringify(indexes)}`).toBe(1);
  expect(indexes[expected], `${ctx} — aba ${expected} deve ter tabindex=0`).toBe('0');
  for (let i = 0; i < count; i += 1) {
    if (i === expected) continue;
    expect(indexes[i], `${ctx} — aba ${i} deve ter tabindex=-1`).toBe('-1');
  }
}

test.describe('Liturgia — wrap cíclico ArrowLeft/ArrowRight + roving tabindex', () => {
  for (const vp of VIEWPORTS) {
    test(`wrap coerente em ${vp.name}`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await page.goto('/liturgia');
      await page.waitForLoadState('networkidle');

      const tablist = page.getByRole('tablist', { name: /Navegação da Liturgia/i });
      await expect(tablist).toBeVisible();
      await tablist.scrollIntoViewIfNeeded();

      const tabs = page.getByRole('tab');
      const count = await tabs.count();
      expect(count).toBeGreaterThan(1);

      // Ativa a primeira aba e confirma estado inicial.
      await tabs.first().focus();
      await page.keyboard.press('Enter');
      await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
      expect(await focusedIndex(page)).toBe(0);
      await assertRoving(page, count, 0, `${vp.name} baseline`);

      // Percurso completo com ArrowRight (0 → count-1) confirmando roving após cada tecla.
      for (let i = 1; i < count; i += 1) {
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');
        await expect(tabs.nth(i)).toHaveAttribute('aria-selected', 'true');
        expect(await focusedIndex(page)).toBe(i);
        await assertRoving(page, count, i, `${vp.name} ArrowRight→${i}`);
      }

      // Wrap: última + ArrowRight → primeira.
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Enter');
      await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
      expect(await focusedIndex(page)).toBe(0);
      await assertRoving(page, count, 0, `${vp.name} wrap→0`);

      // Wrap reverso: primeira + ArrowLeft → última.
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('Enter');
      const last = count - 1;
      await expect(tabs.nth(last)).toHaveAttribute('aria-selected', 'true');
      expect(await focusedIndex(page)).toBe(last);
      await assertRoving(page, count, last, `${vp.name} wrap→last`);

      // Percurso completo reverso com ArrowLeft.
      for (let i = last - 1; i >= 0; i -= 1) {
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('Enter');
        await expect(tabs.nth(i)).toHaveAttribute('aria-selected', 'true');
        expect(await focusedIndex(page)).toBe(i);
        await assertRoving(page, count, i, `${vp.name} ArrowLeft→${i}`);
      }

      await context.close();
    });
  }
});
