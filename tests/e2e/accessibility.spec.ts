import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { AppRoute } from '../../src/types';

const ROUTES_TO_TEST = [
  { path: '/', name: 'Home' },
  { path: '/login', name: 'Login' },
  { path: '/hoje', name: 'Dashboard (Today)' },
  { path: '/catechism', name: 'Catechism' },
];

test.describe('Accessibility & Contrast Audit', () => {
  for (const route of ROUTES_TO_TEST) {
    test(`Audit ${route.name} (${route.path}) - Light Theme`, async ({ page }) => {
      await page.goto(route.path);
      await page.evaluate(() => document.documentElement.classList.remove('dark'));
      await page.waitForTimeout(500); // Wait for theme transition

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // We focus on color-contrast for btn-premium and premium-card specifically if needed,
      // but a general scan is better.
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test(`Audit ${route.name} (${route.path}) - Dark Theme`, async ({ page }) => {
      await page.goto(route.path);
      await page.evaluate(() => document.documentElement.classList.add('dark'));
      await page.waitForTimeout(500);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  }

  test('Premium Components Specific Contrast Check', async ({ page }) => {
    await page.goto('/');
    
    // Check btn-premium contrast in both modes
    const premiumButtons = page.locator('.btn-premium');
    const premiumCards = page.locator('.premium-card');

    for (const theme of ['light', 'dark']) {
      await page.evaluate((t) => {
        if (t === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      }, theme);
      
      await page.waitForTimeout(500);

      const results = await new AxeBuilder({ page })
        .include('.btn-premium')
        .include('.premium-card')
        .analyze();

      if (results.violations.length > 0) {
        console.error(`A11y Violations in ${theme} mode for premium components:`, JSON.stringify(results.violations, null, 2));
      }
      
      expect(results.violations).toEqual([]);
    }
  });
});
