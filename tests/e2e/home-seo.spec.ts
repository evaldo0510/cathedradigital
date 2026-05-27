import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { playAudit } from 'playwright-lighthouse';
const { chromium } = require('@playwright/test');

/**
 * Enhanced SEO, Schema.org, Social Cards and Lighthouse Performance Audit for Home Page
 * Fail on critical errors or performance below threshold.
 */
test.describe('SEO & Metadata Audit - Home Page', () => {
  const auditResults = {
    seo: [] as { status: 'critical' | 'warning' | 'success'; message: string; evidence?: string; suggestion?: string }[],
    schema: [] as { status: 'critical' | 'warning' | 'success'; message: string; evidence?: string; suggestion?: string }[],
    social: [] as { status: 'critical' | 'warning' | 'success'; message: string; evidence?: string; suggestion?: string }[],
    performance: [] as { metric: string; value: string; score?: number }[],
    lighthouse: {} as any,
  };

  test('Comprehensive SEO & Social Audit', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 1. Core SEO Elements (Titles, Descriptions, Headings)
    const title = await page.title();
    if (!title) {
      auditResults.seo.push({ 
        status: 'critical', 
        message: 'Title is missing.',
        suggestion: 'Adicione uma tag <title> dentro do <head>.'
      });
    } else if (title.length < 30 || title.length > 65) {
      auditResults.seo.push({ 
        status: 'warning', 
        message: `Title length (${title.length}) is outside recommended 30-65 range.`,
        evidence: title,
        suggestion: 'Ajuste o título para ter entre 30 e 65 caracteres para melhor exibição no Google.'
      });
    } else {
      auditResults.seo.push({ status: 'success', message: `Title: ${title}` });
    }

    const description = await page.getAttribute('meta[name="description"]', 'content');
    if (!description) {
      auditResults.seo.push({ 
        status: 'critical', 
        message: 'Meta description is missing.',
        suggestion: 'Adicione uma tag <meta name="description" content="...">.'
      });
    } else if (description.length < 120 || description.length > 165) {
      auditResults.seo.push({ 
        status: 'warning', 
        message: `Description length (${description.length}) is outside recommended 120-165 range.`,
        evidence: description,
        suggestion: 'Ajuste a meta descrição para ter entre 120 e 165 caracteres para melhorar a taxa de clique (CTR).'
      });
    } else {
      auditResults.seo.push({ status: 'success', message: 'Meta description is present and properly sized.' });
    }

    const h1Count = await page.locator('h1').count();
    if (h1Count === 0) {
      auditResults.seo.push({ 
        status: 'critical', 
        message: 'H1 tag is missing.',
        suggestion: 'Adicione exatamente um H1 na página (pode ser sr-only no Hero) para definir o tópico principal.'
      });
    } else if (h1Count > 1) {
      auditResults.seo.push({ 
        status: 'critical', 
        message: `Found ${h1Count} H1 tags.`,
        evidence: 'Múltiplos elementos <h1> detectados.',
        suggestion: 'Mantenha apenas um H1 por página para evitar confusão dos mecanismos de busca.'
      });
    } else {
      auditResults.seo.push({ status: 'success', message: 'Found exactly one H1 tag.' });
    }

    const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
    if (!canonical) {
      auditResults.seo.push({ status: 'critical', message: 'Canonical tag is missing.' });
    } else {
      auditResults.seo.push({ status: 'success', message: `Canonical: ${canonical}` });
    }

    const robots = await page.getAttribute('meta[name="robots"]', 'content');
    if (robots && (robots.includes('noindex') || robots.includes('none'))) {
      auditResults.seo.push({ status: 'warning', message: `Robots meta tag is set to restrict indexing: "${robots}". Ensure this is intentional.` });
    } else if (robots) {
      auditResults.seo.push({ status: 'success', message: `Robots meta: ${robots}` });
    } else {
      auditResults.seo.push({ status: 'success', message: 'No indexing restrictions found in robots meta tag.' });
    }

    const hreflangs = await page.locator('link[rel="alternate"][hreflang]').all();
    if (hreflangs.length > 0) {
      for (const hl of hreflangs) {
        const lang = await hl.getAttribute('hreflang');
        const href = await hl.getAttribute('href');
        if (!href) {
          auditResults.seo.push({ status: 'critical', message: `Hreflang for "${lang}" is missing an href attribute.` });
        } else {
          auditResults.seo.push({ status: 'success', message: `Hreflang found: ${lang} -> ${href}` });
        }
      }
    } else {
      auditResults.seo.push({ status: 'warning', message: 'No hreflang tags found. Recommended for multi-language or global sites.' });
    }

    // Link validation (internal/external)
    const links = await page.locator('a').all();
    let brokenLinks = 0;
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (!href || href === '#' || href.startsWith('javascript:')) {
        auditResults.seo.push({ status: 'warning', message: `Empty or placeholder link found: "${await link.innerText()}"` });
      }
    }

    // 2. Social Cards (Open Graph & Twitter Cards)
    const ogTags = [
      { property: 'og:title', required: true },
      { property: 'og:description', required: true },
      { property: 'og:image', required: true },
      { property: 'og:type', required: true },
      { property: 'og:url', required: true }
    ];
    for (const tag of ogTags) {
      const content = await page.getAttribute(`meta[property="${tag.property}"]`, 'content');
      if (!content) {
        auditResults.social.push({ status: 'critical', message: `Missing Open Graph tag: ${tag.property}` });
      } else if (tag.property === 'og:image' && !content.startsWith('http')) {
        auditResults.social.push({ status: 'warning', message: `OG Image path should be absolute: ${content}` });
      } else {
        auditResults.social.push({ status: 'success', message: `Found ${tag.property}` });
      }
    }

    const twitterTags = [
      { name: 'twitter:card', required: true },
      { name: 'twitter:title', required: true },
      { name: 'twitter:description', required: true },
      { name: 'twitter:image', required: true }
    ];
    for (const tag of twitterTags) {
      const content = await page.getAttribute(`meta[name="${tag.name}"]`, 'content');
      if (!content) {
        auditResults.social.push({ status: 'critical', message: `Missing Twitter Card tag: ${tag.name}` });
      } else {
        auditResults.social.push({ status: 'success', message: `Found ${tag.name}` });
      }
    }

    // 3. Schema.org / Structured Data Validation
    const scripts = await page.locator('script[type="application/ld+json"]').all();
    if (scripts.length === 0) {
      auditResults.schema.push({ status: 'critical', message: 'No Schema.org (JSON-LD) found. Critical for search snippets.' });
    } else {
      for (const script of scripts) {
        const content = await script.textContent();
        try {
          const json = JSON.parse(content || '{}');
          if (!json['@context'] || !json['@type']) {
            auditResults.schema.push({ status: 'critical', message: 'Invalid Schema.org structure: missing @context or @type.' });
          } else {
            auditResults.schema.push({ status: 'success', message: `Found valid ${json['@type']} Schema.` });
            
            // Specific check for WebSite schema
            if (json['@type'] === 'WebSite') {
              if (!json.name) auditResults.schema.push({ status: 'warning', message: 'WebSite schema missing "name".' });
              if (!json.url) auditResults.schema.push({ status: 'critical', message: 'WebSite schema missing "url".' });
            }
          }
        } catch (e) {
          auditResults.schema.push({ status: 'critical', message: 'Malformed JSON-LD script (Syntax Error).' });
        }
      }
    }

    // 4. Lighthouse Performance Audit (Skipped in Sandbox, but configured for CI)
    if (process.env.CI === 'true') {
      const browser = await chromium.launch({
        args: ['--remote-debugging-port=9222'],
        headless: true
      });
      
      try {
        const lighthousePage = await browser.newPage();
        
        const threshold = {
          performance: 80,
          accessibility: 90,
          'best-practices': 90,
          seo: 95,
        };

        const results = await playAudit({
          page: lighthousePage,
          thresholds: threshold,
          port: 9222,
          reports: {
            formats: { html: true },
            name: 'lighthouse-report',
            directory: path.join(process.cwd(), 'test-results'),
          },
        });

        if (results && results.lhr) {
          auditResults.lighthouse = results.lhr.categories;
          Object.keys(results.lhr.categories).forEach(key => {
            const cat = results.lhr.categories[key];
            const score = Math.round(cat.score * 100);
            const status = score < (threshold[key as keyof typeof threshold] || 0) ? 'critical' : 'success';
            
            auditResults.performance.push({ 
              metric: cat.title, 
              value: `${score}%`,
              score: score
            });
            
            if (status === 'critical') {
              auditResults.seo.push({ 
                status: 'critical', 
                message: `Lighthouse ${cat.title} score is ${score}%, which is below the minimum threshold of ${threshold[key as keyof typeof threshold]}%.` 
              });
            }
          });
        }
      } finally {
        await browser.close();
      }
    } else {
      console.log('Skipping Lighthouse audit in non-CI environment to avoid missing browser issues.');
    }

    // Generate HTML Report
    generateHTMLReport(auditResults);
    
    // Generate JSON summary for GitHub Actions
    generateJSONSummary(auditResults, 'home');

    // Final Validation: Fail CI on critical errors only
    const criticalErrors = [
      ...auditResults.seo,
      ...auditResults.social,
      ...auditResults.schema
    ].filter(i => i.status === 'critical');
    
    const warnings = [
      ...auditResults.seo,
      ...auditResults.social,
      ...auditResults.schema
    ].filter(i => i.status === 'warning');

    if (warnings.length > 0) {
      console.log('\n--- [SEO & PERF AUDIT WARNINGS] ---');
      warnings.forEach(w => console.log(`⚠️  ${w.message}`));
    }

    if (criticalErrors.length > 0) {
      console.error('\n--- [CRITICAL SEO & PERF ERRORS] ---');
      criticalErrors.forEach(e => console.error(`❌ ${e.message}`));
    }

    expect(criticalErrors.length, `SEO Audit failed with ${criticalErrors.length} critical issues. Review the generated reports.`).toBe(0);
  });
});

function generateHTMLReport(results: any) {
  const reportDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

  const renderItems = (items: { status: string; message: string; evidence?: string; suggestion?: string }[]) => {
    return items.map(i => `
      <li class="status-${i.status}" style="flex-direction: column; align-items: stretch;">
        <div style="display: flex; align-items: center; gap: 10px; font-weight: bold;">
          <span class="icon">${i.status === 'success' ? '✅' : i.status === 'warning' ? '⚠️' : '❌'}</span>
          ${i.message}
        </div>
        ${i.evidence ? `<div style="margin-top: 8px; font-family: monospace; font-size: 12px; background: rgba(0,0,0,0.05); padding: 8px; border-radius: 4px; overflow-wrap: break-word;"><strong>Evidência:</strong> ${i.evidence}</div>` : ''}
        ${i.suggestion ? `<div style="margin-top: 4px; color: #4b5563; font-style: italic;">💡 <strong>Sugestão:</strong> ${i.suggestion}</div>` : ''}
      </li>
    `).join('');
  };

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SEO & Metadata Audit Report - Cathedra Digital</title>
    <style>
        :root {
            --critical: #ef4444;
            --warning: #f59e0b;
            --success: #10b981;
            --bg: #fafafa;
            --card-bg: #ffffff;
            --text: #1f2937;
        }
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; line-height: 1.6; color: var(--text); background: var(--bg); max-width: 900px; margin: 0 auto; padding: 40px 20px; }
        h1 { color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; font-weight: 800; letter-spacing: -0.025em; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .section { background: var(--card-bg); padding: 24px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1); }
        .section h3 { margin-top: 0; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f3f4f6; padding-bottom: 12px; margin-bottom: 16px; font-weight: 600; }
        ul { list-style: none; padding: 0; margin: 0; }
        li { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; font-size: 14px; padding: 8px; border-radius: 6px; }
        .status-critical { background: #fef2f2; color: #991b1b; }
        .status-warning { background: #fffbeb; color: #92400e; }
        .status-success { background: #f0fdf4; color: #166534; }
        .icon { font-style: normal; flex-shrink: 0; }
        .metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .metric-item { background: #f9fafb; padding: 16px; border-radius: 8px; text-align: center; }
        .metric-value { display: block; font-size: 24px; font-weight: 700; color: #111827; }
        .metric-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
        .summary-badge { padding: 4px 12px; border-radius: 9999px; font-size: 12px; }
        footer { text-align: center; margin-top: 60px; color: #9ca3af; font-size: 13px; }
    </style>
</head>
<body>
    <h1>Relatório de Auditoria SEO & Social</h1>
    <p>Data de geração: ${new Date().toLocaleString('pt-BR')}</p>

    <div class="grid">
        <div class="section">
            <h3>Tags Meta & Estrutura</h3>
            <ul>${renderItems(results.seo)}</ul>
        </div>

        <div class="section">
            <h3>Redes Sociais (OG & Twitter)</h3>
            <ul>${renderItems(results.social)}</ul>
        </div>
    </div>

    <div class="grid">
        <div class="section">
            <h3>Dados Estruturados (Schema.org)</h3>
            <ul>${renderItems(results.schema)}</ul>
        </div>

        <div class="section">
            <h3>Lighthouse Performance Scores</h3>
            <div class="metric-grid">
                ${results.performance.map((p: any) => `
                    <div class="metric-item ${p.score && p.score < 70 ? 'status-critical' : ''}">
                        <span class="metric-value">${p.value}</span>
                        <span class="metric-label">${p.metric}</span>
                    </div>
                `).join('')}
            </div>
            <p style="font-size: 11px; margin-top: 15px; color: #666;">
                * Ver relatório detalhado: <a href="lighthouse-report.html">Lighthouse Full Report</a>
            </p>
        </div>
    </div>

    <footer>
        Cathedra Digital Premium Quality Audit System
    </footer>
</body>
</html>
  `;

  fs.writeFileSync(path.join(reportDir, 'seo-audit-report.html'), html);
  console.log(`SEO Audit report generated at: ${path.join(reportDir, 'seo-audit-report.html')}`);
}

function generateJSONSummary(results: any, pageName: string) {
  const reportDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

  const summary = {
    page: pageName,
    timestamp: new Date().toISOString(),
    critical: [
      ...results.seo,
      ...results.social,
      ...results.schema
    ].filter((i: any) => i.status === 'critical').map((i: any) => i.message),
    warnings: [
      ...results.seo,
      ...results.social,
      ...results.schema
    ].filter((i: any) => i.status === 'warning').map((i: any) => i.message),
    performance: results.performance
  };

  fs.writeFileSync(path.join(reportDir, `seo-summary-${pageName}.json`), JSON.stringify(summary, null, 2));
}
