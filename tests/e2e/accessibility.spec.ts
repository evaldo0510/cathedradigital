import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility audit', () => {
  const pages = [
    { name: 'Home', path: '/' },
    { name: 'Hoje', path: '/hoje' },
    { name: 'Biblioteca', path: '/biblioteca' },
  ];

  for (const pageInfo of pages) {
    test(`Auditing ${pageInfo.name} (${pageInfo.path})`, async ({ page }) => {
      await page.goto(pageInfo.path);
      
      // Wait for content to load
      await page.waitForLoadState('networkidle');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  }
});
