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
if (history.length > 30) history.shift();
writeFileSync(historyPath, JSON.stringify(history, null, 2));

writeFileSync(join(reportDir, 'token-audit.json'), JSON.stringify({
  ...currentAudit,
  results,
  history
}, null, 2));

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
        <div class="flex items-center gap-3 mb-1">
          <div class="bg-indigo-600 text-white p-1.5 rounded-lg">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <h1 class="text-3xl font-black text-slate-900 tracking-tight">Cathedra Governance</h1>
        </div>
        <p class="text-slate-500 font-medium">Design System Compliance & Token Enforcement</p>
      </div>
      <div class="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div class="text-right">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Snapshot Date</p>
          <p class="text-sm font-bold text-slate-700">${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
      <div class="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden group">
        <div class="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
        <p class="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-3">Overall Health</p>
        <p class="text-5xl font-black ${totalIssues > threshold ? 'text-rose-400' : 'text-emerald-400'}">${totalIssues}</p>
        <p class="text-xs text-slate-400 mt-3 font-bold uppercase tracking-tight">Threshold Limit: ${threshold}</p>
      </div>
      ${results.map(r => `
        <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">${r.name}</p>
          <p class="text-4xl font-black ${r.issuesCount > 0 ? 'text-rose-600' : 'text-emerald-600'}">${r.issuesCount}</p>
          <div class="flex items-center mt-3">
             <div class="w-2 h-2 rounded-full ${r.issuesCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'} mr-2"></div>
             <span class="text-[10px] font-black text-slate-500 uppercase tracking-tight">${r.issuesCount > 0 ? 'Needs Refactor' : 'Compliant'}</span>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Trend Chart -->
    <div class="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 mb-10 overflow-hidden relative">
      <div class="flex justify-between items-center mb-8">
        <h3 class="text-lg font-black text-slate-800 uppercase tracking-tight">Compliance Trend</h3>
        <span class="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-widest">Last ${history.length} Snapshots</span>
      </div>
      <div class="flex items-end h-40 gap-3 border-b border-slate-100 pb-2">
        ${history.map((h: any, i: number) => {
          const maxVal = Math.max(...history.map((x: any) => x.totalIssues), 20);
          const height = (h.totalIssues / maxVal) * 100;
          return `
            <div class="flex-1 flex flex-col items-center group relative min-w-[20px]">
              <div class="absolute bottom-full mb-3 bg-slate-900 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 whitespace-nowrap z-10 font-bold">
                ${h.totalIssues} issues
              </div>
              <div class="w-full ${i === history.length - 1 ? 'bg-indigo-600' : 'bg-slate-100 hover:bg-slate-200'} rounded-t-lg transition-all duration-500" style="height: ${height || 2}%"></div>
              <span class="text-[8px] font-bold text-slate-300 mt-3 rotate-45 origin-left hidden md:block">${new Date(h.timestamp).toLocaleDateString()}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <div class="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-12">
      <div class="px-8 py-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
        <h3 class="text-lg font-black text-slate-800 uppercase tracking-tight">Violation Registry</h3>
        <div class="flex gap-2">
           <span class="px-3 py-1.5 bg-rose-100 text-rose-700 rounded-xl text-[10px] font-black uppercase tracking-widest">${results.flatMap(r => r.details).length} Active Violations</span>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-slate-50/80 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
            <tr>
              <th class="px-8 py-5">System Domain</th>
              <th class="px-8 py-5">File Hierarchy</th>
              <th class="px-8 py-5 text-center">Value</th>
              <th class="px-8 py-5">Governance Suggestion</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${results.flatMap(r => r.details.map(d => `
              <tr class="hover:bg-slate-50/80 transition-all duration-200">
                <td class="px-8 py-6">
                  <div class="flex items-center gap-2">
                    <div class="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                    <span class="text-sm font-black text-slate-900 uppercase tracking-tight">${r.name}</span>
                  </div>
                </td>
                <td class="px-8 py-6">
                  <div class="text-sm font-bold text-slate-700 font-mono text-[13px]">${d.file}</div>
                  <div class="text-[10px] font-black text-slate-400 uppercase mt-1.5">Sector: src • Line ${d.line}</div>
                </td>
                <td class="px-8 py-6 text-center">
                  <span class="px-2.5 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-black border border-rose-100 shadow-sm font-mono">${d.match}</span>
                </td>
                <td class="px-8 py-6">
                   <div class="flex items-start gap-2.5">
                     <div class="mt-0.5 bg-emerald-100 p-0.5 rounded-md">
                        <svg class="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                     </div>
                     <span class="text-xs font-bold text-slate-500 leading-relaxed">${r.suggestion}</span>
                   </div>
                </td>
              </tr>
            `)).join('')}
            ${totalIssues === 0 ? '<tr><td colspan="4" class="px-8 py-20 text-center"><div class="text-5xl mb-6">🏆</div><div class="text-2xl font-black text-slate-900 uppercase tracking-tight">System Fully Tokenized</div><div class="text-slate-400 font-medium text-sm mt-2">Zero technical debt in Cathedra visual layer.</div></td></tr>' : ''}
          </tbody>
        </table>
      </div>
    </div>
    
    <footer class="mt-8 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] pb-12">
      Governance Protocol Active • Cathedra Product Engineering
    </footer>

  </div>
</body>
</html>
\`;

writeFileSync(join(reportDir, 'token-audit.html'), htmlContent);

console.log(\`\\nAudit finished. Reports generated in /reports\`);

if (!softMode && totalIssues > threshold) {
  process.exit(1);
}

