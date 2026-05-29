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
  '/santos',
];

const A11Y_REPORTS_DIR = path.join(process.cwd(), 'tests/e2e/a11y-reports');

// Ensure reports directory exists
if (!fs.existsSync(A11Y_REPORTS_DIR)) {
  fs.mkdirSync(A11Y_REPORTS_DIR, { recursive: true });
}

test.describe('Global Accessibility & Keyboard Navigation Audit', () => {
  for (const route of ROUTES) {
    test(`Comprehensive audit of ${route}`, async ({ page }, testInfo) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      // 1. WCAG 2.1 AA Audit
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
        .analyze();
      
      // Save report for GitHub Actions artifacts
      const routeName = route === '/' ? 'home' : route.replace(/\//g, '');
      const reportJsonPath = path.join(A11Y_REPORTS_DIR, `a11y-report-${routeName}.json`);
      fs.writeFileSync(reportJsonPath, JSON.stringify(accessibilityScanResults, null, 2));

      // Also attach to testInfo for Playwright HTML report
      await testInfo.attach('accessibility-scan-results', {
        body: JSON.stringify(accessibilityScanResults, null, 2),
        contentType: 'application/json'
      });

      // Log detailed errors for CI troubleshooting
      if (accessibilityScanResults.violations.length > 0) {
        console.error(`\n[A11y FAIL] Found ${accessibilityScanResults.violations.length} violations on ${route}:`);
        accessibilityScanResults.violations.forEach(v => {
          console.error(`- ${v.id}: ${v.help} (Impact: ${v.impact})`);
          v.nodes.forEach(node => {
            console.error(`  Target: ${node.target.join(', ')}`);
          });
        });
      }

      // Fail for any critical or serious violations
      const strictViolations = accessibilityScanResults.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(strictViolations, `Critical accessibility issues found on ${route}`).toEqual([]);

      // 2. Keyboard Navigation Check
      // Move through top elements ensuring focus is visible and sequential
      await page.keyboard.press('Home');
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press('Tab');
        const activeInfo = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;
          const style = window.getComputedStyle(el);
          return {
            label: el.getAttribute('aria-label') || el.textContent?.trim()?.substring(0, 30),
            hasRing: (style.outlineStyle !== 'none' && style.outlineWidth !== '0px') || 
                    (style.boxShadow !== 'none' && style.boxShadow.includes('rgb')),
            tag: el.tagName
          };
        });

        if (activeInfo) {
          expect(activeInfo.hasRing, `Element ${activeInfo.tag} "${activeInfo.label}" should have a visible focus indicator`).toBe(true);
        }
      }
    });
  }
});