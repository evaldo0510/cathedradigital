import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { AppRoute } from '../../src/types';
import fs from 'fs';
import path from 'path';

const RESULTS_DIR = path.join(process.cwd(), 'test-results', 'a11y-reports');
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Configurable threshold for critical errors
const MAX_CRITICAL_ERRORS = parseInt(process.env.A11Y_MAX_CRITICAL_ERRORS || '0', 10);

const a11ySummary: any[] = [];

// Auto-discover all valid routes from AppRoute
const ROUTES_TO_TEST = Object.entries(AppRoute)
  .filter(([key, value]) => typeof value === 'string' && !value.includes(':'))
  .map(([key, value]) => ({ path: value, name: key }));

test.describe('Global Accessibility & Contrast Audit', () => {
  for (const route of ROUTES_TO_TEST) {
    for (const theme of ['light', 'dark']) {
      test(`Audit ${route.name} (${route.path}) - ${theme} mode`, async ({ page }) => {
        await page.goto(route.path);
        
        // Apply theme
        await page.evaluate((t) => {
          if (t === 'dark') document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');
        }, theme);
        
        await page.waitForTimeout(500); // Wait for transitions

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();

        // Count critical violations
        const criticalViolations = results.violations.filter(v => v.impact === 'critical');
        
        a11ySummary.push({
          theme,
          route: route.path,
          name: route.name,
          violations: results.violations.length,
          criticalCount: criticalViolations.length,
          details: results.violations
        });

        // Screenshot for contrast review
        const screenshotPath = path.join(RESULTS_DIR, `contrast-${route.name}-${theme}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        // Fail only if critical violations exceed threshold
        expect(criticalViolations.length, `Route ${route.path} has ${criticalViolations.length} critical a11y violations in ${theme} mode`).toBeLessThanOrEqual(MAX_CRITICAL_ERRORS);
      });
    }
  }

  test('Premium Components - Individual Component Audit', async ({ page }) => {
    await page.goto('/');
    
    const components = [
      { selector: '.btn-premium', name: 'Premium Button' },
      { selector: '.premium-card', name: 'Premium Card' }
    ];

    for (const theme of ['light', 'dark']) {
      await page.evaluate((t) => {
        if (t === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      }, theme);
      
      await page.waitForTimeout(500);

      for (const comp of components) {
        const locator = page.locator(comp.selector).first();
        if (await locator.isVisible()) {
          const results = await new AxeBuilder({ page })
            .include(comp.selector)
            .analyze();

          const critical = results.violations.filter(v => v.impact === 'critical');
          
          a11ySummary.push({
            theme,
            component: comp.name,
            violations: results.violations.length,
            criticalCount: critical.length,
            details: results.violations
          });

          // Component-specific screenshot
          const compPath = path.join(RESULTS_DIR, `comp-${comp.name.replace(/\s+/g, '-')}-${theme}.png`);
          await locator.screenshot({ path: compPath });
        }
      }
    }
  });

  test.afterAll(async () => {
    // Generate HTML report index
    const htmlReport = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Accessibility Audit Report</title>
        <style>
          body { font-family: sans-serif; padding: 20px; background: #f5f5f5; }
          .card { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .error { color: #dc2626; font-weight: bold; }
          .success { color: #16a34a; }
          .theme-badge { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
          .dark { background: #333; color: white; }
          .light { background: #eee; color: #333; }
          img { max-width: 100%; border: 1px solid #ddd; margin-top: 10px; }
          details { margin-top: 10px; font-size: 14px; }
        </style>
      </head>
      <body>
        <h1>Accessibility Audit Summary</h1>
        <p>Threshold: Max ${MAX_CRITICAL_ERRORS} critical errors allowed.</p>
        ${a11ySummary.map(s => `
          <div class="card">
            <h3>
              ${s.name || s.component} 
              <span class="theme-badge ${s.theme}">${s.theme.toUpperCase()}</span>
            </h3>
            <p>Route: ${s.route || 'N/A'}</p>
            <p class="${s.criticalCount > MAX_CRITICAL_ERRORS ? 'error' : 'success'}">
              Violations: ${s.violations} (${s.criticalCount} critical)
            </p>
            <details>
              <summary>View Details</summary>
              <pre>${JSON.stringify(s.details, null, 2)}</pre>
            </details>
            <img src="contrast-${s.name}-${s.theme}.png" alt="Contrast check for ${s.name}">
          </div>
        `).join('')}
      </body>
      </html>
    `;

    fs.writeFileSync(path.join(RESULTS_DIR, 'index.html'), htmlReport);
    fs.writeFileSync(path.join(RESULTS_DIR, 'summary.json'), JSON.stringify(a11ySummary, null, 2));
  });
});
