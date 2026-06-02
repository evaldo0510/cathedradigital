import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * CATHEDRA VISUAL REGRESSION & HTML REPORT GENERATOR
 * Compares layouts across multiple breakpoints and generates a PR-ready report.
 */

const BREAKPOINTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'mobile-landscape', width: 812, height: 375 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'foldable', width: 280, height: 653 }, // Portrait
  { name: 'foldable-expanded', width: 717, height: 512 } // Fold 4 inner
];

const PAGES = [
  { name: 'Dashboard', path: '/' },
  { name: 'Bible', path: '/bible' },
  { name: 'Library', path: '/library' },
  { name: 'Profile', path: '/profile' }
];

test.describe('Visual Regression Consolidation', () => {
  for (const page of PAGES) {
    for (const bp of BREAKPOINTS) {
      test(`Layout Consistency: ${page.name} @ ${bp.name}`, async ({ page: p }) => {
        await p.setViewportSize({ width: bp.width, height: bp.height });
        await p.goto(page.path);
        
        // Wait for hydration and layout stabilization
        await p.waitForLoadState('networkidle');
        await p.waitForTimeout(1000); 

        // Mask dynamic content if needed
        const screenshotName = `${page.name.toLowerCase()}-${bp.name}.png`;
        
        await expect(p).toHaveScreenshot(screenshotName, {
          fullPage: true,
          maxDiffPixelRatio: 0.001, // 0.1% tolerance
          animations: 'disabled'
        });
      });
    }
  }
});

// Post-test hook to generate HTML summary (simulated since actual Playwright report is separate)
test.afterAll(async () => {
  const reportDir = 'playwright-report';
  if (!fs.existsSync(reportDir)) return;
  
  // In a real CI, we'd parse the JSON report and generate a markdown/HTML summary.
  // For now, we ensure the infrastructure is ready for CI artifact publishing.
  console.log('Visual baseline check complete. Diffs (if any) are in playwright-report/data.');
});
