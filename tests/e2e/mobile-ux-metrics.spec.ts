import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const MOBILE_VIEWPORTS = [
  { name: 'mobile-xs', width: 320, height: 568 }, // iPhone SE
  { name: 'mobile-standard', width: 390, height: 844 }, // iPhone 14
  { name: 'mobile-large', width: 430, height: 932 }, // iPhone 14 Pro Max
  { name: 'foldable', width: 280, height: 653 }, // Galaxy Fold
];

const TARGET_ROUTES = [
  '/',
  '/catechism',
  '/bible',
  '/biblioteca',
  '/hoje'
];

interface UXMetrics {
  route: string;
  viewport: string;
  totalPageHeight: number;
  heightToNextCTA: number;
  viewportHeight: number;
}

interface ValidationResult {
  route: string;
  viewport: string;
  hasCuts: boolean;
  hasOverlaps: boolean;
  issues: string[];
}

test.describe('Mobile UX Metrics & Catechism Integrity', () => {
  const metricsResults: UXMetrics[] = [];
  const validationResults: ValidationResult[] = [];

  test.afterAll(async () => {
    const reportDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir);

    fs.writeFileSync(
      path.join(reportDir, 'mobile-ux-metrics.json'),
      JSON.stringify({ metrics: metricsResults, validations: validationResults, timestamp: new Date().toISOString() }, null, 2)
    );
  });

  for (const route of TARGET_ROUTES) {
    for (const vp of MOBILE_VIEWPORTS) {
      test(`Analyze ${route} on ${vp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000); // Allow layout stabilization

        // 1. Calculate Metrics
        const metrics = await page.evaluate(() => {
          const vh = window.innerHeight;
          const totalHeight = document.documentElement.scrollHeight;
          
          // Find first CTA (button or link that looks like a button/action)
          const ctas = Array.from(document.querySelectorAll('button, a.btn, a[role="button"], .button'));
          let firstCTAVisibleY = -1;
          
          for (const cta of ctas) {
            const rect = cta.getBoundingClientRect();
            // We want the first CTA that is actually visible and has size
            if (rect.height > 0 && rect.width > 0) {
              firstCTAVisibleY = rect.top + window.scrollY;
              break;
            }
          }

          return {
            totalPageHeight: totalHeight,
            heightToNextCTA: firstCTAVisibleY,
            viewportHeight: vh
          };
        });

        metricsResults.push({
          route,
          viewport: vp.name,
          ...metrics
        });

        // 2. Specific Catechism Integrity Checks
        if (route === '/catechism') {
          const integrity = await page.evaluate(() => {
            const issues: string[] = [];
            
            // Check for horizontal cuts (overflow-x)
            const hasCuts = document.documentElement.scrollWidth > document.documentElement.clientWidth;
            if (hasCuts) {
              issues.push(`Horizontal overflow detected: scrollWidth(${document.documentElement.scrollWidth}) > clientWidth(${document.documentElement.clientWidth})`);
            }

            // Check for overlaps in critical sections
            const sections = document.querySelectorAll('section, .catechism-section, .mb-4, .py-4');
            sections.forEach((section, i) => {
              const rect = section.getBoundingClientRect();
              const nextSection = sections[i + 1];
              if (nextSection) {
                const nextRect = nextSection.getBoundingClientRect();
                // If the top of the next section is above the bottom of the current section, there's an overlap
                // We add a small tolerance for sub-pixel rendering or intentionally negative margins
                if (nextRect.top < rect.bottom - 2 && rect.height > 0 && nextRect.height > 0) {
                  issues.push(`Potential overlap between section ${i} and ${i+1}`);
                }
              }
            });

            // Check clickability of buttons
            const buttons = document.querySelectorAll('button, a[role="button"]');
            buttons.forEach((btn, i) => {
              const rect = btn.getBoundingClientRect();
              const elAtPoint = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
              
              if (rect.height > 0 && rect.width > 0) {
                if (!elAtPoint || (!btn.contains(elAtPoint) && !elAtPoint.contains(btn))) {
                   // Only report if the element at point is not a child/parent of the button (e.g. an icon inside or an overlay)
                   // and if the overlay is not something we expect
                   const isOverlay = elAtPoint?.classList.contains('overlay') || elAtPoint?.tagName === 'SVG';
                   if (!isOverlay) {
                     issues.push(`Button ${i} ("${btn.textContent?.trim().substring(0, 15)}") might be obscured by ${elAtPoint?.tagName}.${elAtPoint?.className}`);
                   }
                }
              }
            });

            return {
              hasCuts,
              hasOverlaps: issues.some(i => i.includes('overlap')),
              issues
            };
          });

          validationResults.push({
            route,
            viewport: vp.name,
            ...integrity
          });

          if (integrity.issues.length > 0) {
             console.warn(`Catechism issues on ${vp.name}:`, integrity.issues);
          }
        }
      });
    }
  }
});
