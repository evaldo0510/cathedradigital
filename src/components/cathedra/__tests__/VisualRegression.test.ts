import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Quality Assurance: Visual & Accessibility', () => {
  test('Landing Page - Visual & A11y', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); 

    // Visual Regression (Desktop)
    await expect(page).toHaveScreenshot('landing-desktop.png', { fullPage: true });

    // Performance Budget Check (Basic)
    const metrics = await page.evaluate(() => ({
      lcp: performance.getEntriesByName('largest-contentful-paint')[0]?.startTime || 0,
      cls: (window as any).cumulativeLayoutShift || 0,
    }));
    
    // Budgets: LCP < 2.5s, CLS < 0.1
    expect(metrics.lcp).toBeLessThan(2500);
    expect(metrics.cls).toBeLessThan(0.1);

    // Automated Accessibility Scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Auth Page - Visual & A11y', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('auth-page.png');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

