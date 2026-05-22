import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Enhanced SEO, Schema.org and Social Cards Audit for Home Page
 */
test.describe('SEO & Metadata Audit - Home Page', () => {
  const auditResults = {
    seo: [] as string[],
    schema: [] as string[],
    social: [] as string[],
    performance: [] as { metric: string; value: string }[],
    warnings: [] as string[],
  };

  test('Comprehensive Metadata Audit', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 1. Core SEO Elements
    const title = await page.title();
    if (!title || title.length < 30 || title.length > 60) {
      auditResults.seo.push(`Title "${title}" length (${title?.length || 0}) is outside 30-60 range.`);
    }

    const description = await page.getAttribute('meta[name="description"]', 'content');
    if (!description) {
      auditResults.seo.push('Critical: Meta description is missing.');
    } else if (description.length < 120 || description.length > 160) {
      auditResults.warnings.push(`Description length (${description.length}) is outside 120-160 range.`);
    }

    const h1Count = await page.locator('h1').count();
    if (h1Count !== 1) {
      auditResults.seo.push(`Critical: Found ${h1Count} H1 tags. Exactly one is required.`);
    }

    const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
    if (!canonical) {
      auditResults.seo.push('Critical: Canonical tag is missing.');
    }

    // 2. Social Cards (OG & Twitter)
    const ogTags = ['og:title', 'og:description', 'og:image', 'og:type', 'og:url'];
    for (const tag of ogTags) {
      const content = await page.getAttribute(`meta[property="${tag}"]`, 'content');
      if (!content) auditResults.social.push(`Critical: Missing Social tag: ${tag}`);
    }

    const twitterTags = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'];
    for (const tag of twitterTags) {
      const content = await page.getAttribute(`meta[name="${tag}"]`, 'content');
      if (!content) auditResults.social.push(`Critical: Missing Twitter tag: ${tag}`);
    }

    // 3. Schema.org / Structured Data
    const scripts = await page.locator('script[type="application/ld+json"]').all();
    if (scripts.length === 0) {
      auditResults.schema.push('Critical: No Schema.org (JSON-LD) found.');
    } else {
      for (const script of scripts) {
        const content = await script.textContent();
        try {
          const json = JSON.parse(content || '{}');
          if (!json['@context'] || !json['@type']) {
            auditResults.schema.push('Critical: Invalid Schema.org structure (missing @context or @type).');
          }
        } catch (e) {
          auditResults.schema.push('Critical: Malformed JSON-LD script.');
        }
      }
    }

    // 4. Performance Basics
    const timing = await page.evaluate(() => {
      const t = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: t.domContentLoadedEventEnd - t.startTime,
        loadTime: t.loadEventEnd - t.startTime,
      };
    });
    auditResults.performance.push({ metric: 'DOM Content Loaded', value: `${timing.domContentLoaded.toFixed(0)}ms` });
    auditResults.performance.push({ metric: 'Full Load Time', value: `${timing.loadTime.toFixed(0)}ms` });

    // Generate HTML Report
    generateHTMLReport(auditResults);

    // Final Validation: Fail CI on critical SEO, Social or Schema errors
    const criticalErrors = [...auditResults.seo, ...auditResults.social, ...auditResults.schema].filter(e => e.includes('Critical'));
    
    if (auditResults.warnings.length > 0) {
      console.log('\n--- SEO Audit Warnings ---');
      auditResults.warnings.forEach(w => console.log(`[WARNING] ${w}`));
    }

    if (criticalErrors.length > 0) {
      console.error('\n--- CRITICAL SEO FAILURES ---');
      criticalErrors.forEach(e => console.error(`[ERROR] ${e}`));
    }

    expect(criticalErrors.length, `SEO Audit failed with ${criticalErrors.length} critical issues. See report for details.`).toBe(0);
  });
});

function generateHTMLReport(results: any) {
  const reportDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SEO & Metadata Audit Report</title>
    <style>
        body { font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { border-bottom: 2px solid #eee; padding-bottom: 10px; color: #1a1a1a; }
        .section { margin-bottom: 30px; padding: 15px; border-radius: 8px; border: 1px solid #eee; }
        .critical { border-left: 5px solid #d32f2f; background: #fff8f8; }
        .warning { border-left: 5px solid #ffa000; background: #fffdf0; }
        .success { border-left: 5px solid #388e3c; background: #f8fff8; }
        .metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .metric-item { background: #f5f5f5; padding: 10px; border-radius: 4px; }
        ul { padding-left: 20px; }
        li { margin-bottom: 5px; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; margin-bottom: 10px; }
        .badge-critical { background: #d32f2f; color: white; }
        .badge-warning { background: #ffa000; color: white; }
    </style>
</head>
<body>
    <h1>SEO & Metadata Audit Report</h1>
    <p>Generated on: ${new Date().toLocaleString()}</p>

    <div class="section ${results.seo.length > 0 ? 'critical' : 'success'}">
        <h3>Meta Tags & Structure</h3>
        ${results.seo.length > 0 ? '<ul>' + results.seo.map((i: string) => `<li>${i}</li>`).join('') + '</ul>' : '<p>✅ All core SEO tags are present and correct.</p>'}
    </div>

    <div class="section ${results.social.length > 0 ? 'critical' : 'success'}">
        <h3>Social Cards (OG & Twitter)</h3>
        ${results.social.length > 0 ? '<ul>' + results.social.map((i: string) => `<li>${i}</li>`).join('') + '</ul>' : '<p>✅ Social sharing metadata is fully configured.</p>'}
    </div>

    <div class="section ${results.schema.length > 0 ? 'critical' : 'success'}">
        <h3>Structured Data (Schema.org)</h3>
        ${results.schema.length > 0 ? '<ul>' + results.schema.map((i: string) => `<li>${i}</li>`).join('') + '</ul>' : '<p>✅ JSON-LD Schema.org data found and validated.</p>'}
    </div>

    ${results.warnings.length > 0 ? `
    <div class="section warning">
        <h3>Optimization Warnings</h3>
        <ul>${results.warnings.map((i: string) => `<li>${i}</li>`).join('')}</ul>
    </div>` : ''}

    <div class="section">
        <h3>Performance Baseline</h3>
        <div class="metric-grid">
            ${results.performance.map((p: any) => `
                <div class="metric-item">
                    <strong>${p.metric}:</strong> ${p.value}
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>
  `;

  fs.writeFileSync(path.join(reportDir, 'seo-audit-report.html'), html);
  console.log(`SEO Audit report generated at: ${path.join(reportDir, 'seo-audit-report.html')}`);
}
