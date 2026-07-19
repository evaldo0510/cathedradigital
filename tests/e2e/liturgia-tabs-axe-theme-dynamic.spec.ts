import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const VIEWPORTS = [
  { name: 'mobile-portrait-390x844', width: 390, height: 844 },
  { name: 'mobile-landscape-844x390', width: 844, height: 390 },
  { name: 'tablet-portrait-768x1024', width: 768, height: 1024 },
  { name: 'tablet-landscape-1024x768', width: 1024, height: 768 },
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

async function runAxe(page) {
  return new AxeBuilder({ page })
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
          'duplicate-id-aria',
        ],
      },
    })
    .analyze();
}

test.describe('Liturgia — axe durante alternância dinâmica dark↔light (sem reload)', () => {
  for (const vp of VIEWPORTS) {
    test(`sem violações ARIA/contrast alternando tema em ${vp.name}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        hasTouch: true,
      });
      const page = await context.newPage();
      await page.goto('/liturgia');
      await page.waitForLoadState('networkidle');

      const tablist = page.getByRole('tablist', { name: /Navegação da Liturgia/i });
      await expect(tablist).toBeVisible();
      await tablist.scrollIntoViewIfNeeded();

      const sequence: Array<'dark' | 'light'> = ['dark', 'light', 'dark', 'light'];
      const allViolations: any[] = [];

      for (const mode of sequence) {
        await setTheme(page, mode);
        await page.waitForTimeout(200);

        // Ativa aba diferente a cada iteração para cobrir estados
        const tabs = page.getByRole('tab');
        const count = await tabs.count();
        const targetIndex = sequence.indexOf(mode) % count;
        await tabs.nth(targetIndex).click();
        await expect(tabs.nth(targetIndex)).toHaveAttribute('aria-selected', 'true');
        await page.waitForTimeout(150);

        const results = await runAxe(page);
        if (results.violations.length) {
          allViolations.push(
            ...results.violations.map((v) => ({
              viewport: vp.name,
              theme: mode,
              id: v.id,
              impact: v.impact,
              help: v.help,
              nodes: v.nodes.length,
            })),
          );
        }
      }

      if (allViolations.length) {
        console.log(`[${vp.name}] axe violations dinâmicas:`, JSON.stringify(allViolations, null, 2));
      }
      expect(
        allViolations,
        `violações axe durante alternância dinâmica em ${vp.name}`,
      ).toEqual([]);

      await context.close();
    });
  }
});
