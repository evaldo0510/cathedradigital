import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

test.describe('Home Page Accessibility & Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for main content
    await page.waitForSelector('main#main-content', { state: 'visible' });
  });

  test('full accessibility audit with strict criteria', async ({ page }, testInfo) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
      .analyze();
    
    // Attach report for all findings
    const reportPath = path.join(testInfo.outputDir, `a11y-report-${testInfo.project.name}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(accessibilityScanResults, null, 2));
    await testInfo.attach('accessibility-scan-results', {
      path: reportPath,
      contentType: 'application/json'
    });

    // FAIL only on Critical and Serious violations
    const strictViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    if (accessibilityScanResults.violations.length > 0) {
      console.log(`Found ${accessibilityScanResults.violations.length} total a11y violations.`);
      accessibilityScanResults.violations.forEach(v => {
        if (v.impact !== 'critical' && v.impact !== 'serious') {
          console.warn(`[A11y Warning] ${v.id}: ${v.help} (Impact: ${v.impact})`);
        } else {
          console.error(`[A11y CRITICAL] ${v.id}: ${v.help} (Impact: ${v.impact})`);
        }
      });
    }

    expect(strictViolations, 'Found critical or serious accessibility violations').toEqual([]);
  });

  test('should have valid landmarks and skip link', async ({ page }) => {
    // Check for main landmark
    await expect(page.locator('role=main')).toBeVisible();
    
    // Check for skip link functionality
    await page.keyboard.press('Tab');
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();
    await page.keyboard.press('Enter');
    
    // Verify focus moved to main content
    const mainContent = page.locator('main#main-content');
    await expect(mainContent).toBeFocused();
  });

  test('visual focus ring visibility on HomeButton and HomeCard', async ({ page }) => {
    const interactiveElements = page.locator('button, a[href], [role="button"]');
    const count = await interactiveElements.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const element = interactiveElements.nth(i);
      await element.focus();
      
      const hasFocusStyles = await element.evaluate((node) => {
        const style = window.getComputedStyle(node);
        return style.boxShadow !== 'none' || style.outlineStyle !== 'none' || style.outlineWidth !== '0px';
      });
      
      expect(hasFocusStyles, `Element ${i} should have visible focus styles`).toBe(true);
    }
  });

  test('interaction consistency: Enter and Space trigger same action', async ({ page }) => {
    const cta = page.getByRole('button', { name: /Iniciar Jornada/i }).first();
    if (await cta.isVisible()) {
      await cta.scrollIntoViewIfNeeded();

      const checkModal = async () => {
        await expect(page.locator('text=Como podemos ajudar você hoje?')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.locator('text=Como podemos ajudar você hoje?')).not.toBeVisible();
      };

      await cta.focus();
      await page.keyboard.press(' ');
      await checkModal();

      await cta.focus();
      await page.keyboard.press('Enter');
      await checkModal();
    }
  });
});