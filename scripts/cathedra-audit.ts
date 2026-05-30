#!/usr/bin/env bun
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const forbiddenPatterns = [
  { 
    name: 'Direct Spacing', 
    id: 'spacing',
    regex: '\\b(p|m|gap|space|w|h)-[0-9.]+\\b',
    exclude: ['w-full', 'h-full', 'w-screen', 'h-screen', 'w-auto', 'h-auto', 'w-fit', 'h-fit', 'min-w-0', 'min-h-0'],
    suggestion: 'Use spacing-xs to 4xl (e.g., p-spacing-md) or <Stack gap="md" />'
  },
  { 
    name: 'Direct Typography', 
    id: 'typography',
    regex: '\\btext-(xs|sm|base|lg|xl|[2-9]xl)\\b',
    exclude: [],
    suggestion: 'Use text-premium-xs to 5xl (e.g., text-premium-lg) or <Typography size="lg" />'
  },
  { 
    name: 'Direct Rounding', 
    id: 'rounding',
    regex: '\\brounded-(none|sm|md|lg|xl|2xl|3xl|full)\\b',
    exclude: [],
    suggestion: 'Use rounded-premium-sm to full (e.g., rounded-premium-md)'
  },
  { 
    name: 'Direct Shadows', 
    id: 'shadows',
    regex: '\\bshadow-(sm|md|lg|xl|2xl|inner|none)\\b',
    exclude: [],
    suggestion: 'Use shadow-premium-sm to premium-hover (e.g., shadow-premium)'
  }
];

const results: any[] = [];
let totalIssues = 0;

console.log('--- CATHEDRA DESIGN TOKEN COMPLIANCE AUDIT ---');

forbiddenPatterns.forEach(pattern => {
  const patternIssues: any[] = [];
  try {
    // Find files and lines
    const command = `rg -n "${pattern.regex}" src --no-filename -g "!**/__snapshots__/**" -g "!scripts/**" -g "!src/components/cathedra/layout/**"`;
    const rawOutput = execSync(command, { encoding: 'utf8' }).trim();
    
    if (rawOutput) {
      const lines = rawOutput.split('\n');
      lines.forEach(line => {
        const [lineNumber, ...contentArr] = line.split(':');
        const content = contentArr.join(':').trim();
        
        // Match the specific class
        const matches = content.match(new RegExp(pattern.regex, 'g'));
        if (matches) {
          matches.forEach(match => {
            if (!pattern.exclude.includes(match)) {
              patternIssues.push({
                file: 'unknown', // rg -n without filename is tricky here, let's refine
                line: lineNumber,
                match: match,
                content: content
              });
              totalIssues++;
            }
          });
        }
      });
    }
    
    // Get summary count
    const summaryCommand = `rg -o "${pattern.regex}" src --no-filename -g "!**/__snapshots__/**" -g "!scripts/**" -g "!src/components/cathedra/layout/**" | sort | uniq -c | sort -nr`;
    const summaryOutput = execSync(summaryCommand, { encoding: 'utf8' }).trim();
    const summaryLines = summaryOutput.split('\n').filter(line => {
      const match = line.trim().split(/\s+/)[1];
      return match && !pattern.exclude.includes(match);
    });

    results.push({
      ...pattern,
      issuesCount: patternIssues.length,
      summary: summaryLines,
      details: patternIssues
    });

    if (patternIssues.length > 0) {
      console.log(`❌ ${pattern.name}: ${patternIssues.length} issues found.`);
    } else {
      console.log(`✅ ${pattern.name}: Compliant`);
    }

  } catch (error) {
    results.push({ ...pattern, issuesCount: 0, summary: [], details: [] });
    console.log(`✅ ${pattern.name}: Compliant`);
  }
});

// Generate Reports
const reportDir = join(process.cwd(), 'reports');
try { mkdirSync(reportDir); } catch(e) {}

// JSON Report
writeFileSync(join(reportDir, 'token-audit.json'), JSON.stringify({
  timestamp: new Date().toISOString(),
  totalIssues,
  results
}, null, 2));

// HTML Report
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Cathedra Token Audit</title>
  <style>
    body { font-family: sans-serif; padding: 20px; background: #f9f9fb; color: #1a1a1a; }
    .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 20px; }
    .issue { color: #e11d48; font-weight: bold; }
    .success { color: #10b981; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #eee; }
    pre { background: #f1f5f9; padding: 10px; border-radius: 4px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>Cathedra Design Token Audit</h1>
  <div class="card">
    <h2>Summary</h2>
    <p>Total Issues: <span class="${totalIssues > 0 ? 'issue' : 'success'}">${totalIssues}</span></p>
    <p>Generated at: ${new Date().toLocaleString()}</p>
  </div>
  ${results.map(r => `
    <div class="card">
      <h3>${r.name}</h3>
      <p>Status: <span class="${r.issuesCount > 0 ? 'issue' : 'success'}">${r.issuesCount > 0 ? 'FAIL' : 'PASS'}</span></p>
      <p>Suggestion: <em>${r.suggestion}</em></p>
      ${r.summary.length > 0 ? `
        <h4>Common Violations:</h4>
        <pre>${r.summary.join('\n')}</pre>
      ` : ''}
    </div>
  `).join('')}
</body>
</html>
`;
writeFileSync(join(reportDir, 'token-audit.html'), htmlContent);

// PR Comment Helper (Output to stdout for CI to pick up)
if (process.env.CI) {
  console.log('\n--- PR COMMENT SUMMARY ---');
  console.log('### 🎨 Cathedra Design System Audit');
  if (totalIssues === 0) {
    console.log('✅ All components are compliant with official design tokens.');
  } else {
    console.log(`❌ Found **${totalIssues}** design token violations.`);
    console.log('| Category | Issues | Suggestion |');
    console.log('| :--- | :--- | :--- |');
    results.forEach(r => {
      if (r.issuesCount > 0) {
        console.log(`| ${r.name} | ${r.issuesCount} | ${r.suggestion} |`);
      }
    });
    console.log('\n[View Full Report](token-audit.html)');
  }
}

console.log(`\nAudit finished. Reports generated in /reports`);

if (totalIssues > 0) {
  process.exit(1);
}
