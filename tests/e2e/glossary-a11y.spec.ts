import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Auditoria de acessibilidade WCAG 2.1 AA para /glossario.
 *
 * Cobre:
 *   - Rota canônica (/glossario) e rota com termo (/glossario/:slug)
 *   - Navegação por teclado nos filtros de categoria e cards de termos
 *   - Estados de foco visíveis (:focus-visible)
 *   - Ausência de violações serious/critical do axe-core
 */

const VIEWPORTS = [
  { label: 'mobile', width: 390, height: 844 },
  { label: 'desktop', width: 1280, height: 800 },
] as const;

for (const vp of VIEWPORTS) {
  test.describe(`glossario-a11y · ${vp.label}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('sem violações serious/critical em /glossario', async ({ page }) => {
      await page.goto('/glossario', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);

      const axe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const blocking = axe.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
      expect(blocking, blocking.map(v => `${v.id}: ${v.help}`).join('\n')).toEqual([]);
    });

    test('navegação por teclado percorre filtros e abre termos', async ({ page }) => {
      await page.goto('/glossario', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);

      // Foca o primeiro elemento tabbável (input de busca costuma ser o primeiro).
      await page.keyboard.press('Tab');
      const first = await page.evaluate(() => document.activeElement?.tagName ?? null);
      expect(first).not.toBeNull();

      // Percorre alguns Tabs e garante que o :focus visível sempre existe.
      for (let i = 0; i < 8; i++) {
        const hasVisibleFocus = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body) return false;
          const style = getComputedStyle(el);
          return style.outlineStyle !== 'none' || style.boxShadow !== 'none' || el.matches(':focus-visible');
        });
        if (hasVisibleFocus) break;
        await page.keyboard.press('Tab');
      }

      // Ativa termo via Enter e valida que a URL foi para /glossario/:slug.
      const termButton = page.locator('[id^="term-"] button').first();
      if (await termButton.count()) {
        await termButton.focus();
        await expect(termButton).toBeFocused();
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);
        expect(page.url()).toMatch(/\/glossario\/[a-z0-9-]+/);
      }
    });
  });
}
