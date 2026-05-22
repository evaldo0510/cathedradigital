import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

test.describe('Home Page Accessibility & Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for main content to be visible before starting tests
    await page.waitForSelector('#main-content', { state: 'visible' });
  });

  test('strict accessibility audit', async ({ page }, testInfo) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
      .analyze();
    
    // Attach report for all findings to test artifacts
    const reportPath = path.join(testInfo.outputDir, `a11y-report-${testInfo.project.name}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(accessibilityScanResults, null, 2));
    await testInfo.attach('accessibility-scan-results', {
      path: reportPath,
      contentType: 'application/json'
    });

    // 1. Separate violations by impact
    const strictViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    const warnings = accessibilityScanResults.violations.filter(
      v => v.impact !== 'critical' && v.impact !== 'serious'
    );

    // 2. Log warnings for future correction
    if (warnings.length > 0) {
      console.log(`\n[A11y Warnings] Found ${warnings.length} non-critical issues to be addressed later:`);
      warnings.forEach(v => {
        console.warn(`- ${v.id}: ${v.help} (Impact: ${v.impact})`);
      });
    }

    // 3. Log detailed errors for critical/serious issues
    if (strictViolations.length > 0) {
      console.error(`\n[A11y CRITICAL] Found ${strictViolations.length} critical/serious issues that block CI:`);
      strictViolations.forEach(v => {
        console.error(`- ${v.id}: ${v.help} (Impact: ${v.impact})`);
        v.nodes.forEach(node => {
          console.error(`  Target: ${node.target.join(', ')}`);
        });
      });
    }

    // 4. FAIL the test ONLY if there are critical/serious violations
    expect(strictViolations, 'Found critical or serious accessibility violations. Fix these before merging.').toEqual([]);
  });

  test('landmark verification and keyboard navigation', async ({ page }) => {
    // 1. Verify existence of core landmarks
    await expect(page.locator('role=main'), 'Should have a <main> landmark').toBeVisible();
    await expect(page.locator('role=navigation'), 'Should have a <nav> landmark').toBeVisible();
    
    // Footer might be lazy loaded or conditional, but check if it's there
    const footer = page.locator('role=contentinfo');
    if (await footer.count() > 0) {
      await expect(footer).toBeVisible();
    }
    
    // 2. Verify Skip to Content link
    const skipLink = page.locator('a[href="#main-content"]').first();
    await expect(skipLink, 'Skip to content link should be present').toBeAttached();
    
    // Focus the skip link via keyboard
    await page.focus('body');
    await page.keyboard.press('Tab');
    
    // Check if skip link is focused
    await expect(skipLink).toBeFocused();
    
    // Press Enter and verify focus moves to main content
    await page.keyboard.press('Enter');
    
    const mainContent = page.locator('main#main-content');
    await expect(mainContent, 'Focus should move to #main-content after clicking skip link').toBeFocused();
  });

  test('interactive element focus visibility', async ({ page }) => {
    const interactiveElements = page.locator('button, a[href], [role="button"]');
    const count = await interactiveElements.count();
    
    // Test the first 5 interactive elements for focus styles
    for (let i = 0; i < Math.min(count, 5); i++) {
      const element = interactiveElements.nth(i);
      await element.focus();
      
      const hasFocusStyles = await element.evaluate((node) => {
        const style = window.getComputedStyle(node);
        // Check for common focus indicators: outline or box-shadow
        return (
          (style.outlineStyle !== 'none' && style.outlineWidth !== '0px') || 
          (style.boxShadow !== 'none' && style.boxShadow !== '')
        );
      });
      
      expect(hasFocusStyles, `Interactive element ${i} should show a visible focus indicator`).toBe(true);
    }
  });
});