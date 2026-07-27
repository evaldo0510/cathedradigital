import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * A11y da seção de Depoimentos (landing `/` e `/sobre`) — WCAG 2.1 A/AA,
 * mobile e desktop, incluindo navegação por teclado dos controles do carrossel.
 */

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 900 },
] as const;

const ROUTES = ['/', '/sobre'] as const;

for (const route of ROUTES) {
  for (const vp of VIEWPORTS) {
    test.describe(`Depoimentos · ${route} · ${vp.name}`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test('sem violações axe na seção', async ({ page }) => {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        const section = page.locator('section[aria-labelledby="testimonials-heading"]').first();
        await expect(section).toBeVisible();

        const results = await new AxeBuilder({ page })
          .include('section[aria-labelledby="testimonials-heading"]')
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();

        expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
      });

      test('carousel com landmark e slides rotulados', async ({ page }) => {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        const carousel = page.getByRole('region', { name: /depoimentos/i }).first();
        await expect(carousel).toBeVisible();
        await expect(carousel).toHaveAttribute('aria-roledescription', /carrossel/i);

        const slides = carousel.locator('[role="group"][aria-roledescription="slide"]');
        expect(await slides.count()).toBeGreaterThan(0);
      });

      test('controles prev/next e dots navegáveis por teclado', async ({ page }) => {
        await page.goto(route);
        await page.waitForLoadState('networkidle');

        const next = page.getByRole('button', { name: /próximo depoimento/i }).first();
        const prev = page.getByRole('button', { name: /depoimento anterior/i }).first();
        await expect(next).toBeVisible();
        await expect(prev).toBeVisible();

        // Foco via teclado + ativação com Enter
        await next.focus();
        await expect(next).toBeFocused();
        await page.keyboard.press('Enter');

        // Dot correspondente ao segundo slide deve ficar aria-selected=true
        const dots = page.getByRole('tab', { name: /Ir para depoimento/i });
        await expect(dots.nth(1)).toHaveAttribute('aria-selected', 'true');

        // Voltar via botão anterior
        await prev.focus();
        await page.keyboard.press('Enter');
        await expect(dots.nth(0)).toHaveAttribute('aria-selected', 'true');
      });
    });
  }
}
