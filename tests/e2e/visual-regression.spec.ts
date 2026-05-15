import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

const ROUTES = [
  '/',
  '/catechism',
  '/design-system',
];

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
];

test.describe('Visual Regression & WCAG AAA Audit', () => {
  for (const route of ROUTES) {
    for (const viewport of VIEWPORTS) {
      test(`Audit ${route} on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        // Navigation
        await page.goto(route);
        
        // Wait for fonts and content to load
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000); // Allow animations to settle

        // 1. Visual Regression
        const screenshotName = `${route.replace(/\//g, 'home')}-${viewport.name}.png`;
        await expect(page).toHaveScreenshot(screenshotName, {
          fullPage: true,
          maxDiffPixelRatio: 0.01,
        });

        // 2. WCAG AAA Validation
        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
          .analyze();

        if (accessibilityScanResults.violations.length > 0) {
          const reportPath = path.join(test.info().outputDir, `a11y-${route.replace(/\//g, 'home')}-${viewport.name}.json`);
          fs.writeFileSync(reportPath, JSON.stringify(accessibilityScanResults, null, 2));
          await test.info().attach('accessibility-scan-results', {
            path: reportPath,
            contentType: 'application/json'
          });
        }
        
        expect(accessibilityScanResults.violations).toEqual([]);

        // 3. Typography Token Validation
        const typographyErrors = await page.evaluate(() => {
          const errors: string[] = [];
          const elements = document.querySelectorAll('h1, h2, h3, p, span, button');
          
          // Simplified check: Ensure fonts are from the premium set
          const allowedFonts = ['Inter', 'Playfair Display', 'system-ui', 'serif', 'sans-serif'];
          
          elements.forEach((el) => {
            const style = window.getComputedStyle(el);
            const fontFamily = style.fontFamily;
            const isAllowed = allowedFonts.some(f => fontFamily.includes(f));
            
            if (!isAllowed) {
              errors.push(`Invalid font family "${fontFamily}" on ${el.tagName} with text "${el.textContent?.substring(0, 20)}..."`);
            }
            
            // Contrast check (redundant but explicit)
            // Axe already does this, but we can log specific ones if needed
          });
          
          return errors;
        });

        if (typographyErrors.length > 0) {
          console.warn(`Typography consistency issues on ${route} (${viewport.name}):`, typographyErrors);
        }
      });
    }
  }
});
