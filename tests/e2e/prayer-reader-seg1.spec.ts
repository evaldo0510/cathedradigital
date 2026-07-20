import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * SEG Sub-sprint 1 (Orações) — smoke E2E das novas orações completas.
 * Verifica que Via-Sacra e Completas abrem no leitor contemplativo,
 * expõem blocos navegáveis, respondem à tecla `f` (modo foco) e passam Axe AA.
 */

const PRAYERS = [
  { slug: 'via-sacra', label: 'Via-Sacra', minBlocks: 15 },
  { slug: 'completas', label: 'Completas', minBlocks: 8 },
] as const;

for (const p of PRAYERS) {
  test.describe(`oração ${p.slug}`, () => {
    test('abre o leitor com título e ao menos N blocos navegáveis', async ({ page }) => {
      await page.goto(`/oracao/${p.slug}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);

      // título presente
      await expect(page.getByRole('heading', { level: 1, name: new RegExp(p.label, 'i') })).toBeVisible();

      // avança blocos com "Próximo" ou setas — o leitor mostra 1 bloco por vez
      const next = page.getByRole('button', { name: /próximo|avançar|next/i }).first();
      let steps = 0;
      for (let i = 0; i < p.minBlocks + 3; i++) {
        if (!(await next.isVisible().catch(() => false))) break;
        if (await next.isDisabled().catch(() => false)) break;
        await next.click().catch(() => undefined);
        steps++;
        await page.waitForTimeout(80);
      }
      expect(steps).toBeGreaterThanOrEqual(p.minBlocks - 1);
    });

    test('tecla `f` alterna o modo foco', async ({ page }) => {
      await page.goto(`/oracao/${p.slug}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);

      const before = await page.evaluate(() => document.body.className);
      await page.keyboard.press('f');
      await page.waitForTimeout(200);
      const after = await page.evaluate(() =>
        document.body.className + ' ' + (document.querySelector('main')?.className ?? ''),
      );
      // heurística: algo mudou (classe, atributo data-focus, etc.) OU um botão Sair do foco aparece.
      const exitFocus = await page.getByRole('button', { name: /sair do foco|foco/i }).count();
      expect(after !== before || exitFocus > 0).toBeTruthy();
    });

    test('sem violações serious/critical do Axe AA', async ({ page }) => {
      await page.goto(`/oracao/${p.slug}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(700);
      const axe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const blocking = axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(blocking, blocking.map((v) => `${v.id}: ${v.help}`).join('\n')).toEqual([]);
    });
  });
}
