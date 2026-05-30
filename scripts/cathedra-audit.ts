#!/usr/bin/env bun
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const spacingMap: Record<string, string> = {
  '0.5': 'spacing-3xs',
  '1': 'spacing-2xs',
  '1.5': 'spacing-2xs',
  '2': 'spacing-xs',
  '3': 'spacing-sm',
  '4': 'spacing-md',
  '5': 'spacing-lg',
  '6': 'spacing-xl',
  '8': 'spacing-2xl',
  '10': 'spacing-3xl',
  '12': 'spacing-4xl',
  '16': 'spacing-4xl',
};

export const roundingMap: Record<string, string> = {
  'none': 'premium-none',
  'sm': 'premium-sm',
  'md': 'premium-md',
  'lg': 'premium-lg',
  'xl': 'premium-lg',
  '2xl': 'premium',
  '3xl': 'premium',
  'full': 'premium-full',
};

export const shadowMap: Record<string, string> = {
  'none': 'premium-none',
  'sm': 'premium-sm',
  'md': 'premium',
  'lg': 'premium-hover',
  'xl': 'premium-xl',
  '2xl': 'premium-xl',
};

export const typographyMap: Record<string, string> = {
  'xs': 'premium-xs',
  'sm': 'premium-sm',
  'base': 'premium-base',
  'lg': 'premium-lg',
  'xl': 'premium-xl',
  '2xl': 'premium-2xl',
  '3xl': 'premium-3xl',
  '4xl': 'premium-4xl',
  '5xl': 'premium-5xl',
};

export const forbiddenPatterns = [
  { 
    name: 'Direct Spacing', 
    id: 'spacing',
    regex: '\\b(p|m|gap|space|w|h)-([0-9.]+)\\b',
    exclude: ['w-full', 'h-full', 'w-screen', 'h-screen', 'w-auto', 'h-auto', 'w-fit', 'h-fit', 'min-w-0', 'min-h-0'],
    suggestion: 'Use spacing-xs to 4xl (e.g., p-spacing-md) or <Stack gap="md" />',
    fix: (match: string) => {
      const [prefix, value] = match.split('-');
      const token = spacingMap[value];
      return token ? `${prefix}-${token}` : match;
    }
  },
  { 
    name: 'Direct Typography', 
    id: 'typography',
    regex: '\\btext-(xs|sm|base|lg|xl|[2-9]xl)\\b',
    exclude: [],
    suggestion: 'Use text-premium-xs to 5xl (e.g., text-premium-lg) or <Typography size="lg" />',
    fix: (match: string) => {
      const value = match.replace('text-', '');
      const token = typographyMap[value];
      return token ? `text-${token}` : match;
    }
  },
  { 
    name: 'Direct Rounding', 
    id: 'rounding',
    regex: '\\brounded-(none|sm|md|lg|xl|2xl|3xl|full)\\b',
    exclude: [],
    suggestion: 'Use rounded-premium-sm to full (e.g., rounded-premium-md)',
    fix: (match: string) => {
      const value = match.replace('rounded-', '');
      const token = roundingMap[value];
      return token ? `rounded-${token}` : match;
    }
  },
  { 
    name: 'Direct Shadows', 
    id: 'shadows',
    regex: '\\bshadow-(sm|md|lg|xl|2xl|inner|none)\\b',
    exclude: [],
    suggestion: 'Use shadow-premium-sm to premium-hover (e.g., shadow-premium)',
    fix: (match: string) => {
      const value = match.replace('shadow-', '');
      const token = shadowMap[value];
      return token ? `shadow-${token}` : match;
    }
  }
];

export function runAudit() {
  const args = process.argv.slice(2);
  const threshold = parseInt(args.find(arg => arg.startsWith('--threshold='))?.split('=')[1] || '5');
  const softMode = args.includes('--soft');
  const fixMode = args.includes('--fix');
  const dryRun = args.includes('--dry-run');

  const results: any[] = [];
  let totalIssues = 0;
  let fixedCount = 0;

console.log('--- CATHEDRA DESIGN TOKEN COMPLIANCE AUDIT ---');
if (fixMode) console.log('--- AUTO-FIX MODE ENABLED ---');
if (dryRun) console.log('--- DRY RUN MODE: No files will be modified ---');

forbiddenPatterns.forEach(pattern => {
  const patternIssues: any[] = [];
  try {
    const command = `rg -n "${pattern.regex}" src -g "!**/__snapshots__/**" -g "!scripts/**" -g "!src/components/cathedra/layout/**" --color=never`;
    const rawOutput = execSync(command, { encoding: 'utf8' }).trim();
    
    if (rawOutput) {
      const lines = rawOutput.split('\n');
      const filesToFix = new Map<string, string>();

      lines.forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 3) {
          const file = parts[0];
          const lineNumber = parts[1];
          const content = parts.slice(2).join(':').trim();
          
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

                if (fixMode || dryRun) {
                  const fixedValue = pattern.fix(match);
                  if (fixedValue !== match) {
                    if (dryRun) {
                      console.log(`  [DRY RUN] Would replace "${match}" with "${fixedValue}" in ${file}:${lineNumber}`);
                      fixedCount++;
                    } else if (fixMode) {
                      let fileContent = filesToFix.get(file) || readFileSync(file, 'utf8');
                      const newContent = fileContent.replace(new RegExp(`\\b${match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), fixedValue);
                      if (newContent !== fileContent) {
                        filesToFix.set(file, newContent);
                        fixedCount++;
                      }
                    }
                  }
                }
              }
            });
          }
        }
      });

      if (fixMode && !dryRun && filesToFix.size > 0) {
        filesToFix.forEach((content, path) => {
          writeFileSync(path, content);
        });
      }
    }
    
    results.push({
      ...pattern,
      issuesCount: patternIssues.length,
      details: patternIssues
    });

    if (patternIssues.length > 0) {
      console.log(`${fixMode ? '🛠️' : '❌'} ${pattern.name}: ${patternIssues.length} issues found.`);
    } else {
      console.log(`✅ ${pattern.name}: Compliant`);
    }

  } catch (error) {
    results.push({ ...pattern, issuesCount: 0, details: [] });
    console.log(`✅ ${pattern.name}: Compliant`);
  }
});

if (dryRun) {
  console.log(`\n--- DRY RUN FINISHED: ${fixedCount} potential issues identified ---`);
} else if (fixMode) {
  console.log(`\n--- FIXED ${fixedCount} ISSUES AUTOMATICALLY ---`);
}

const reportDir = join(process.cwd(), 'reports');
if (!existsSync(reportDir)) mkdirSync(reportDir);

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
if (history.length > 30) history.shift();
writeFileSync(historyPath, JSON.stringify(history, null, 2));

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Cathedra Compliance Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
    body { font-family: 'Inter', sans-serif; background: #f8fafc; color: #1e293b; }
  </style>
</head>
<body class="p-4 md:p-8">
  <div class="max-w-6xl mx-auto">
    <header class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-8 border-b border-slate-200 gap-4">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Cathedra Governance</h1>
        <p class="text-slate-500 font-medium">Design System Compliance & Token Enforcement</p>
      </div>
      <div class="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Snapshot Date</p>
          <p class="text-sm font-bold text-slate-700">${new Date().toLocaleString()}</p>
      </div>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
      <div class="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800">
        <p class="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-3">Health Score</p>
        <p class="text-5xl font-black ${totalIssues > threshold ? 'text-rose-400' : 'text-emerald-400'}">${totalIssues}</p>
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-3">Tolerance: ${threshold}</p>
      </div>
      ${results.map(r => `
        <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">${r.name}</p>
          <p class="text-4xl font-black ${r.issuesCount > 0 ? 'text-rose-600' : 'text-emerald-600'}">${r.issuesCount}</p>
          <div class="flex items-center mt-3">
             <div class="w-1.5 h-1.5 rounded-full ${r.issuesCount > 0 ? 'bg-rose-500' : 'bg-emerald-500'} mr-2"></div>
             <span class="text-[10px] font-bold text-slate-500 uppercase">${r.issuesCount > 0 ? 'Review' : 'Verified'}</span>
          </div>
        </div>
      `).join('')}
    </div>


    <div class="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 mb-10 overflow-hidden relative">
      <div class="flex justify-between items-center mb-8">
        <h3 class="text-lg font-black text-slate-800 uppercase tracking-tight">Compliance Trend</h3>
        <span class="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-widest">Last ${history.length} Snapshots</span>
      </div>
      <div class="flex items-end h-32 gap-3 border-b border-slate-100 pb-2">
        ${history.map((h: any, i: number) => {
          const maxVal = Math.max(...history.map((x: any) => x.totalIssues), 20);
          const height = Math.max((h.totalIssues / maxVal) * 100, 5);
          return `
            <div class="flex-1 flex flex-col items-center group relative min-w-[20px]">
              <div class="w-full ${i === history.length - 1 ? 'bg-indigo-600' : 'bg-slate-100 hover:bg-slate-200'} rounded-t-lg transition-all" style="height: ${height}%"></div>
            </div>
          `;
        }).join('')}
      </div>
    </div>


    <div class="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-12">
      <div class="px-8 py-6 border-b border-slate-100 bg-slate-50/30">
        <h3 class="text-lg font-black text-slate-800 uppercase tracking-tight">Violation Registry</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-slate-50/80 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
            <tr>
              <th class="px-8 py-5">Domain</th>
              <th class="px-8 py-5">File</th>
              <th class="px-8 py-5 text-center">Value</th>
              <th class="px-8 py-5">Suggestion</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${results.flatMap(r => r.details.map(d => `
              <tr>
                <td class="px-8 py-6 text-sm font-black text-slate-900 uppercase tracking-tight">${r.name}</td>
                <td class="px-8 py-6">
                  <div class="text-sm font-bold text-slate-700 font-mono text-[13px]">${d.file}</div>
                  <div class="text-[10px] font-black text-slate-400 uppercase mt-1.5">Line ${d.line}</div>
                </td>
                <td class="px-8 py-6 text-center">
                  <span class="px-2.5 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-black border border-rose-100 font-mono">${d.match}</span>
                </td>
                <td class="px-8 py-6 text-xs font-bold text-slate-500">${r.suggestion}</td>
              </tr>
            `)).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</body>
</html>
`;

writeFileSync(join(reportDir, 'token-audit.html'), htmlContent);
writeFileSync(join(reportDir, 'token-audit.json'), JSON.stringify({ ...currentAudit, results, history }, null, 2));

  console.log('\nAudit finished. Reports generated in /reports');
  if (!softMode && totalIssues > threshold) process.exit(1);
}

if (import.meta.main) {
  runAudit();
}
