import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Verifica que com prefers-reduced-motion=reduce:
 * - animações/transições não quebram o estado de foco durante a alternância de abas
 * - axe-core não reporta violações após cada troca de tema + aba
 */

const VIEWPORTS = [
  { name: 'mobile-portrait-390x844', width: 390, height: 844 },
  { name: 'tablet-portrait-768x1024', width: 768, height: 1024 },
];

async function setTheme(page, mode: 'dark' | 'light') {
  await page.evaluate((m) => {
    document.documentElement.classList.toggle('dark', m === 'dark');
    document.documentElement.setAttribute('data-theme', m);
    try {
      localStorage.setItem('theme', m);
      localStorage.setItem('vite-ui-theme', m);
    } catch {}
  }, mode);
}

test.describe('Liturgia — prefers-reduced-motion durante troca de tema e abas', () => {
  for (const vp of VIEWPORTS) {
    test(`sem quebra de foco/a11y em ${vp.name}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        reducedMotion: 'reduce',
        hasTouch: true,
      });
      const page = await context.newPage();
      await page.goto('/liturgia');
      await page.waitForLoadState('networkidle');

      const tablist = page.getByRole('tablist', { name: /Navegação da Liturgia/i });
      await expect(tablist).toBeVisible();
      await tablist.scrollIntoViewIfNeeded();

      const tabs = page.getByRole('tab');
      const count = await tabs.count();
      expect(count).toBeGreaterThan(1);

      const sequence: Array<{ theme: 'dark' | 'light'; target: number }> = [];
      const themes: Array<'dark' | 'light'> = ['dark', 'light', 'dark', 'light'];
      for (let i = 0; i < themes.length; i += 1) sequence.push({ theme: themes[i], target: i % count });

      for (const step of sequence) {
        await setTheme(page, step.theme);
        await tabs.first().focus();
        for (let i = 0; i < step.target; i += 1) await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');
        await expect(tabs.nth(step.target)).toHaveAttribute('aria-selected', 'true');

        // Foco deve permanecer na aba ativada — reduced-motion não pode quebrar isso.
        const focusedIndex = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el) return -1;
          const all = Array.from(document.querySelectorAll('[role="tab"]'));
          return all.indexOf(el as Element);
        });
        expect(focusedIndex).toBe(step.target);

        // Regressão: reduced-motion não deve introduzir violações axe.
        const results = await new AxeBuilder({ page })
          .include('[role="tablist"][aria-label*="Liturgia"]')
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();
        expect(
          results.violations,
          `violações axe com reduced-motion (${vp.name}, ${step.theme}, aba ${step.target})`,
        ).toEqual([]);
      }

      await context.close();
    });
  }
});
