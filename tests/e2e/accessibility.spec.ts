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

  test('full accessibility audit with axe-core and report generation', async ({ page }, testInfo) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
      .analyze();
    
    // Attach report if violations found
    if (accessibilityScanResults.violations.length > 0) {
      const reportPath = path.join(testInfo.outputDir, `a11y-report-${testInfo.project.name}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(accessibilityScanResults, null, 2));
      await testInfo.attach('accessibility-scan-results', {
        path: reportPath,
        contentType: 'application/json'
      });
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have a functional skip link as first tabbable element', async ({ page }) => {
    await page.keyboard.press('Tab');
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();
    // In mobile, it might be visually hidden but still accessible. 
    // We expect it to be Visible when focused (per CSS)
    await expect(skipLink).toBeVisible();
    
    await page.keyboard.press('Enter');
    const mainContent = page.locator('main#main-content');
    await expect(mainContent).toBeFocused();
  });

  test('visual focus ring visibility on HomeButton and HomeCard', async ({ page }) => {
    // Select all HomeButton and HomeCard elements that are interactive
    const interactiveElements = page.locator('button, a[href], [role="button"]');
    const count = await interactiveElements.count();
    
    // Test a subset to avoid excessive run time, focus on the first few in view
    for (let i = 0; i < Math.min(count, 5); i++) {
      const element = interactiveElements.nth(i);
      await element.focus();
      
      // Check for focus ring or outline. 
      // Tailwind's ring adds a box-shadow or specific outline.
      // focus-visible:ring-primary focus-visible:ring-offset-2
      const hasFocusStyles = await element.evaluate((node) => {
        const style = window.getComputedStyle(node);
        return style.boxShadow !== 'none' || style.outlineStyle !== 'none' || style.outlineWidth !== '0px';
      });
      
      expect(hasFocusStyles, `Element ${i} should have visible focus styles`).toBe(true);
    }
  });

  test('interaction consistency: Enter and Space trigger same action', async ({ page }) => {
    // Find "Iniciar Jornada" button as a primary CTA
    const cta = page.getByRole('button', { name: /Iniciar Jornada/i }).first();
    await cta.scrollIntoViewIfNeeded();

    const checkModal = async () => {
      // Check if GuidedJourney modal opens
      await expect(page.locator('text=Como podemos ajudar você hoje?')).toBeVisible();
      // Close it
      await page.keyboard.press('Escape');
      await expect(page.locator('text=Como podemos ajudar você hoje?')).not.toBeVisible();
    };

    // Test Space
    await cta.focus();
    await page.keyboard.press(' ');
    await checkModal();

    // Test Enter
    await cta.focus();
    await page.keyboard.press('Enter');
    await checkModal();

    // Test Click for baseline
    await cta.click();
    await checkModal();
  });

  test('logical tab order and navigation targets', async ({ page }) => {
    // Start from top
    await page.keyboard.press('Tab'); // Skip link
    
    // Tab through header
    const logo = page.getByLabel(/Cathedra Digital/i).or(page.locator('a').first());
    await page.keyboard.press('Tab');
    
    // Check if we reach specific sections in order (simplified for stability across viewports)
    const sections = ['#continue-journey', '#daily-ritual', '#main-themes'];
    for (const selector of sections) {
        const element = page.locator(selector);
        if (await element.count() > 0 && await element.isVisible()) {
            // Tab until we reach something inside this section or the section itself
            // This is a loose check because specific links might vary by content
            const isInSection = async () => {
                return await page.evaluate((sel) => {
                    const active = document.activeElement;
                    return active && (active.closest(sel) || active.id === sel.replace('#', ''));
                }, selector);
            };
            
            let attempts = 0;
            while (attempts < 30 && !await isInSection()) {
                await page.keyboard.press('Tab');
                attempts++;
            }
            expect(attempts).toBeLessThan(30);
        }
    }
  });
});
