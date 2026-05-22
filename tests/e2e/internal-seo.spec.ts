import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Audit SEO for internal pages beyond Home
 */
test.describe('SEO & Metadata Audit - Internal Pages', () => {
  const pagesToAudit = [
    { name: 'Encyclopedia', path: '/encyclopedia' },
    { name: 'Bible', path: '/bible' },
    { name: 'Search', path: '/search' }
  ];

  const allAuditResults: Record<string, any> = {};

  for (const pageInfo of pagesToAudit) {
    test(`Audit for ${pageInfo.name} (${pageInfo.path})`, async ({ page }) => {
      const auditResults = {
        name: pageInfo.name,
        path: pageInfo.path,
        seo: [] as { status: 'critical' | 'warning' | 'success'; message: string }[],
        social: [] as { status: 'critical' | 'warning' | 'success'; message: string }[],
        schema: [] as { status: 'critical' | 'warning' | 'success'; message: string }[],
        performance: [] as { metric: string; value: string }[],
      };

      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      // 1. Core SEO
      const title = await page.title();
      if (!title) {
        auditResults.seo.push({ status: 'critical', message: 'Title is missing.' });
      } else {
        auditResults.seo.push({ status: 'success', message: `Title: ${title}` });
      }

      const description = await page.getAttribute('meta[name="description"]', 'content');
      if (!description) {
        auditResults.seo.push({ status: 'warning', message: 'Meta description is missing.' });
      } else {
        auditResults.seo.push({ status: 'success', message: 'Meta description is present.' });
      }

      const h1Count = await page.locator('h1').count();
      if (h1Count === 0) {
        auditResults.seo.push({ status: 'critical', message: 'No H1 tag found.' });
      } else {
        auditResults.seo.push({ status: 'success', message: `Found ${h1Count} H1 tag(s).` });
      }

      const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
      if (!canonical) {
        auditResults.seo.push({ status: 'critical', message: 'Canonical tag is missing.' });
      } else {
        auditResults.seo.push({ status: 'success', message: `Canonical: ${canonical}` });
      }

      const robots = await page.getAttribute('meta[name="robots"]', 'content');
      if (robots && (robots.includes('noindex') || robots.includes('none'))) {
        auditResults.seo.push({ status: 'warning', message: `Robots meta restricts indexing: "${robots}"` });
      }

      const hreflangs = await page.locator('link[rel="alternate"][hreflang]').all();
      if (hreflangs.length > 0) {
        auditResults.seo.push({ status: 'success', message: `Found ${hreflangs.length} hreflang tag(s).` });
      }

      // 2. Social
      const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
      if (!ogTitle) {
        auditResults.social.push({ status: 'warning', message: 'Missing og:title' });
      } else {
        auditResults.social.push({ status: 'success', message: 'Found og:title' });
      }

      // 3. Performance
      const performanceData = await page.evaluate(() => {
        const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        return entry ? { load: entry.loadEventEnd - entry.startTime } : null;
      });
      if (performanceData) {
        auditResults.performance.push({ metric: 'Load Time', value: `${performanceData.load.toFixed(0)}ms` });
      }

      allAuditResults[pageInfo.path] = auditResults;

      // Final Check
      const criticalErrors = [...auditResults.seo, ...auditResults.social].filter(i => i.status === 'critical');
      expect(criticalErrors.length, `${pageInfo.name} has ${criticalErrors.length} critical SEO issues.`).toBe(0);
    });
  }

  test.afterAll(async () => {
    generateInternalHTMLReport(allAuditResults);
  });
});

function generateInternalHTMLReport(results: Record<string, any>) {
  const reportDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

  const sections = Object.values(results).map(res => `
    <div class="page-audit">
      <h2>${res.name} (${res.path})</h2>
      <div class="grid">
        <div class="section">
          <h3>SEO & Social</h3>
          <ul>
            ${[...res.seo, ...res.social].map((i: any) => `
              <li class="status-${i.status}">
                <span>${i.status === 'success' ? '✅' : i.status === 'warning' ? '⚠️' : '❌'}</span>
                ${i.message}
              </li>
            `).join('')}
          </ul>
        </div>
        <div class="section">
          <h3>Performance</h3>
          <ul>
            ${res.performance.map((p: any) => `<li><strong>${p.metric}:</strong> ${p.value}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>
  `).join('');

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Internal Pages SEO Audit</title>
    <style>
        body { font-family: sans-serif; padding: 20px; background: #f4f4f4; }
        .page-audit { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .status-critical { color: red; }
        .status-warning { color: orange; }
        .status-success { color: green; }
        li { margin-bottom: 8px; list-style: none; }
    </style>
</head>
<body>
    <h1>Audit de SEO - Páginas Internas</h1>
    ${sections}
</body>
</html>
  `;

  fs.writeFileSync(path.join(reportDir, 'internal-seo-audit-report.html'), html);
}
