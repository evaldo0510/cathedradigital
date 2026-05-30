#!/usr/bin/env bun
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const args = process.argv.slice(2);
const threshold = parseInt(args.find(arg => arg.startsWith('--threshold='))?.split('=')[1] || '0');
const softMode = args.includes('--soft');

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
if (threshold > 0) console.log(`Threshold: ${threshold} issues allowed`);
if (softMode) console.log('Mode: Soft (Informative)');

forbiddenPatterns.forEach(pattern => {
  const patternIssues: any[] = [];
  try {
    // Find files and lines with filenames
    const command = `rg -n "${pattern.regex}" src -g "!**/__snapshots__/**" -g "!scripts/**" -g "!src/components/cathedra/layout/**"`;
    const rawOutput = execSync(command, { encoding: 'utf8' }).trim();
    
    if (rawOutput) {
      const lines = rawOutput.split('\n');
      lines.forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 3) {
          const file = parts[0];
          const lineNumber = parts[1];
          const content = parts.slice(2).join(':').trim();
          
          // Match the specific class
          const matches = content.match(new RegExp(pattern.regex, 'g'));
          if (matches) {
            matches.forEach(match => {
              if (!pattern.exclude.includes(match)) {
                patternIssues.push({
                  file,
                  line: lineNumber,
                  match: match,
                  content: content
                });
                totalIssues++;
              }
            });
          }
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

// History Tracking (Aggregating)
const reportDir = join(process.cwd(), 'reports');
try { mkdirSync(reportDir); } catch(e) {}

const historyPath = join(reportDir, 'compliance-history.json');
let history = [];
if (existsSync(historyPath)) {
  try {
    history = JSON.parse(readFileSync(historyPath, 'utf8'));
  } catch (e) {
    history = [];
  }
}

const currentAudit = {
  timestamp: new Date().toISOString(),
  totalIssues,
  categories: results.map(r => ({ id: r.id, count: r.issuesCount }))
};

history.push(currentAudit);
// Keep last 30 entries
if (history.length > 30) history.shift();
writeFileSync(historyPath, JSON.stringify(history, null, 2));

// JSON Report
writeFileSync(join(reportDir, 'token-audit.json'), JSON.stringify({
  ...currentAudit,
  results,
  history
}, null, 2));

// HTML Report (Dashboard style)
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Cathedra Compliance Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; background: #f8fafc; }
  </style>
</head>
<body class="p-8">
  <div class="max-w-6xl mx-auto">
    <header class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Compliance Dashboard</h1>
        <p class="text-slate-500">Cathedra Design System Token Audit</p>
      </div>
      <div class="text-right">
        <p class="text-sm font-medium text-slate-500">Last Audit</p>
        <p class="text-lg font-bold text-slate-900">${new Date().toLocaleString()}</p>
      </div>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <p class="text-sm font-medium text-slate-500 mb-1">Total Violations</p>
        <p class="text-3xl font-bold ${totalIssues > threshold ? 'text-rose-600' : 'text-emerald-600'}">${totalIssues}</p>
        <p class="text-xs text-slate-400 mt-2">Threshold: ${threshold}</p>
      </div>
      ${results.map(r => `
        <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p class="text-sm font-medium text-slate-500 mb-1">${r.name}</p>
          <p class="text-3xl font-bold ${r.issuesCount > 0 ? 'text-rose-600' : 'text-emerald-600'}">${r.issuesCount}</p>
          <p class="text-xs text-slate-400 mt-2">${r.issuesCount > 0 ? 'Action required' : 'Fully compliant'}</p>
        </div>
      `).join('')}
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
      <div class="px-6 py-4 border-bottom border-slate-100 bg-slate-50">
        <h3 class="font-bold text-slate-800">Violation Details</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
            <tr>
              <th class="px-6 py-3">Category</th>
              <th class="px-6 py-3">File</th>
              <th class="px-6 py-3">Line</th>
              <th class="px-6 py-3">Violation</th>
              <th class="px-6 py-3">Suggestion</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${results.flatMap(r => r.details.map(d => `
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4 text-sm font-medium text-slate-900">${r.name}</td>
                <td class="px-6 py-4 text-sm text-slate-600 font-mono">${d.file}</td>
                <td class="px-6 py-4 text-sm text-slate-600">${d.line}</td>
                <td class="px-6 py-4 text-sm"><span class="px-2 py-1 bg-rose-50 text-rose-700 rounded-md font-mono">${d.match}</span></td>
                <td class="px-6 py-4 text-sm text-slate-500 italic">${r.suggestion}</td>
              </tr>
            `)).join('')}
            ${totalIssues === 0 ? '<tr><td colspan="5" class="px-6 py-10 text-center text-slate-400">✅ No violations found. Great job!</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</body>
</html>
`;
writeFileSync(join(reportDir, 'token-audit.html'), htmlContent);

console.log(`\nAudit finished. Reports generated in /reports`);

if (!softMode && totalIssues > threshold) {
  process.exit(1);
}

