import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * A11y da página /pricing — WCAG 2.1 A/AA em mobile e desktop.
 * Cobre hierarquia de headings, labels de CTA e contraste dos cards.
 */

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 900 },
] as const;

for (const vp of VIEWPORTS) {
  test.describe(`/pricing · a11y (${vp.name})`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('hierarquia de headings correta', async ({ page }) => {
      await page.goto('/pricing');
      await page.waitForLoadState('networkidle');

      // Exatamente um <h1> visível
      const h1s = await page.locator('h1:visible').allTextContents();
      expect(h1s.length, `esperava 1 <h1>, achou ${h1s.length}`).toBe(1);
      expect(h1s[0]).toMatch(/Escolha seu Caminho/i);

      // Não pula níveis (h1 → h2/h3 permitido; h1 → h5+ não)
      const levels = await page.$$eval('h1,h2,h3,h4,h5,h6', (nodes) =>
        nodes
          .filter((n) => (n as HTMLElement).offsetParent !== null)
          .map((n) => Number(n.tagName.slice(1))),
      );
      let prev = 0;
      for (const lvl of levels) {
        if (prev > 0 && lvl > prev + 1) {
          throw new Error(`Salto de heading h${prev} → h${lvl}: ${levels.join(',')}`);
        }
        prev = Math.min(prev, lvl) || lvl;
      }
    });

    test('CTAs têm nome acessível', async ({ page }) => {
      await page.goto('/pricing');
      await page.waitForLoadState('networkidle');

      const buttons = page.getByRole('button');
      const count = await buttons.count();
      expect(count, 'nenhum botão em /pricing').toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const btn = buttons.nth(i);
        if (!(await btn.isVisible())) continue;
        const name = (await btn.getAttribute('aria-label')) || (await btn.innerText());
        expect(name.trim(), `botão #${i} sem nome acessível`).not.toBe('');
      }
    });

    test('axe sem violações WCAG 2.1 A/AA (incl. color-contrast)', async ({ page }) => {
      await page.goto('/pricing');
      await page.waitForLoadState('networkidle');
      // Estabiliza animações antes de medir contraste
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForTimeout(300);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .include('main, [data-testid="plan-card-free"], [data-testid="plan-card-pro"]')
        .analyze();

      if (results.violations.length > 0) {
        const summary = results.violations
          .map(
            (v) =>
              `• [${v.impact ?? 'n/a'}] ${v.id} — ${v.help} (${v.nodes.length})\n    ${v.helpUrl}`,
          )
          .join('\n');
        throw new Error(`axe achou ${results.violations.length} violação(ões):\n${summary}`);
      }
      expect(results.violations).toEqual([]);
    });
  });
}
