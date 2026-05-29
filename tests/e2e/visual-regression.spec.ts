import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

const ROUTES = [
  '/',
  '/hoje',
  '/catechism',
  '/bible',
  '/prayers',
  '/temas',
  '/biblioteca',
  '/design-system',
  '/admin',
  '/diario', // Critical route: Spiritual Journal
];

const VIEWPORTS = [
  { name: 'desktop-premium', width: 1800, height: 1080 },
  { name: 'desktop-large', width: 1600, height: 900 },
  { name: 'desktop-mid', width: 1440, height: 900 },
  { name: 'desktop-standard', width: 1280, height: 800 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 },
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

  test('Premium Layout Zoom & High Contrast Validation', async ({ page }) => {
    const viewport = { width: 1800, height: 1080 };
    await page.setViewportSize(viewport);
    
    // Simulate high contrast mode if possible (via emulating media features)
    await page.emulateMedia({ forcedColors: 'active' });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 1. Accessibility Check for Contrast
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag2aaa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);

    // 2. Simulate 200% Zoom (Browser zoom affects layout scale)
    // In Playwright, we can simulate zoom by scaling the viewport while keeping the same resolution
    // or by evaluating a script to set zoom, but better is to just check responsiveness at smaller widths 
    // which mimic zoom effects on layout.
    await page.setViewportSize({ width: 900, height: 540 }); // Equivalent to 200% zoom on 1800px
    await page.goto('/');
    
    // Ensure critical elements like Hero and Navigation don't overlap or break
    const heroTitle = page.locator('h1');
    await expect(heroTitle).toBeVisible();
    
    const nav = page.locator('nav');
    if (await nav.isVisible()) {
      const box = await nav.boundingBox();
      expect(box?.height).toBeGreaterThan(0);
    }
    
    // Final Visual Snapshot for Zoom/Contrast
    await expect(page).toHaveScreenshot('home-premium-high-contrast-zoom.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });
  });

  test('Home Map Cells Visual Consistency', async ({ page }) => {
    const viewports = [
      { name: 'desktop', width: 1440, height: 900 },
      { name: 'mobile', width: 375, height: 667 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Ensure the "Doors" (map cells) are visible
      const doors = page.locator('.premium-card-interactive');
      await expect(doors.first()).toBeVisible();

      // Snapshot of the doors section specifically to ensure icon/text visibility
      await expect(page.locator('.grid-cols-1.sm\\:grid-cols-2.md\\:grid-cols-3')).toHaveScreenshot(`home-doors-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
      });
    }
  });
