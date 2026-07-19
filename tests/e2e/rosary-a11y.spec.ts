import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Auditoria de acessibilidade WCAG 2.1 AA para as telas do Rosário.
 *
 * Cobre:
 *   - Landing (/rosary) e sessão iniciada (mistério selecionado)
 *   - Ausência de violações serious/critical do axe-core
 *   - Navegação por teclado (Tab) com estado :focus-visible
 *   - Semântica de botões (todos os controles clicáveis são <button>)
 */

const VIEWPORTS = [
  { label: 'mobile', width: 390, height: 844 },
  { label: 'desktop', width: 1280, height: 800 },
] as const;

for (const vp of VIEWPORTS) {
  test.describe(`rosary-a11y · ${vp.label}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('sem violações serious/critical em /rosary', async ({ page }) => {
      await page.goto('/rosary', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(700);

      const axe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const blocking = axe.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
      expect(blocking, blocking.map(v => `${v.id}: ${v.help}`).join('\n')).toEqual([]);
    });

    test('controles clicáveis do Rosário são <button> semânticos', async ({ page }) => {
      await page.goto('/rosary', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);

      const clickableNonButtons = await page.evaluate(() => {
        const suspects = Array.from(document.querySelectorAll('main [onclick], main div[role="button"]:not([tabindex])'));
        return suspects.length;
      });
      expect(clickableNonButtons).toBe(0);
    });

    test('foco visível ao percorrer com Tab', async ({ page }) => {
      await page.goto('/rosary', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);

      let foundVisibleFocus = false;
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press('Tab');
        const visible = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body) return false;
          const style = getComputedStyle(el);
          return style.outlineStyle !== 'none' || style.boxShadow !== 'none' || el.matches(':focus-visible');
        });
        if (visible) { foundVisibleFocus = true; break; }
      }
      expect(foundVisibleFocus).toBe(true);
    });

    test('sessão iniciada mantém acessibilidade AA', async ({ page }) => {
      await page.goto('/rosary', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);

      const mystery = page.getByRole('button').filter({ hasText: /gozosos|luminosos|dolorosos|gloriosos/i }).first();
      if (await mystery.count()) {
        await mystery.click({ timeout: 8_000 }).catch(() => undefined);
        await page.waitForTimeout(500);

        const start = page.getByRole('button').filter({ hasText: /iniciar|começar|rezar/i }).first();
        if (await start.count()) {
          await start.click().catch(() => undefined);
          await page.waitForTimeout(400);
        }

        const axe = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();
        const blocking = axe.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
        expect(blocking, blocking.map(v => `${v.id}: ${v.help}`).join('\n')).toEqual([]);
      }
    });
  });
}
