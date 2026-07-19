import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const VIEWPORTS = [
  { name: 'mobile-portrait-390x844', width: 390, height: 844 },
  { name: 'mobile-landscape-844x390', width: 844, height: 390 },
  { name: 'tablet-portrait-768x1024', width: 768, height: 1024 },
  { name: 'tablet-landscape-1024x768', width: 1024, height: 768 },
];

test.describe('Liturgia — axe-core em dark mode (mobile + tablet)', () => {
  for (const vp of VIEWPORTS) {
    test(`sem violações ARIA/contrast em ${vp.name} [dark]`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: 'dark',
        hasTouch: true,
      });
      const page = await context.newPage();
      await page.addInitScript(() => {
        try {
          localStorage.setItem('theme', 'dark');
          localStorage.setItem('vite-ui-theme', 'dark');
        } catch {}
      });
      await page.goto('/liturgia');
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      });
      await page.waitForLoadState('networkidle');

      const tablist = page.getByRole('tablist', { name: /Navegação da Liturgia/i });
      await expect(tablist).toBeVisible();
      await tablist.scrollIntoViewIfNeeded();

      const results = await new AxeBuilder({ page })
        .include('[role="tablist"][aria-label*="Liturgia"]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .options({
          runOnly: {
            type: 'rule',
            values: [
              'color-contrast',
              'button-name',
              'link-name',
              'aria-allowed-attr',
              'aria-required-attr',
              'aria-valid-attr',
              'aria-valid-attr-value',
              'aria-roles',
              'focus-order-semantics',
              'tabindex',
              'nested-interactive',
            ],
          },
        })
        .analyze();

      if (results.violations.length) {
        console.log(`[${vp.name}] Axe violations:`, JSON.stringify(results.violations, null, 2));
      }
      expect(
        results.violations,
        `violações axe em dark ${vp.name}`,
      ).toEqual([]);

      await context.close();
    });
  }
});
