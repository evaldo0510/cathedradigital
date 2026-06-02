import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface Violation {
  file: string;
  line: number;
  type: string;
  description: string;
  suggestion: string;
  codeSnippet?: string;
}

interface PageCompliance {
  name: string;
  path: string;
  layout: number;
  cards: number;
  theme: number;
  tokens: number;
  overall: number;
  violations: Violation[];
  trends?: {
    overall: number;
    layout: number;
    cards: number;
    theme: number;
    tokens: number;
  };
}

const PAGES = [
  { name: 'Home', path: 'src/components/cathedra/HomeMainContent.tsx' },
  { name: 'Bible', path: 'src/components/cathedra/Bible.tsx' },
  { name: 'Catechism', path: 'src/components/cathedra/Catechism.tsx' },
  { name: 'Library', path: 'src/components/cathedra/BibliotecaPage.tsx' },
  { name: 'Documents', path: 'src/components/cathedra/DocumentViewer.tsx' },
  { name: 'Search', path: 'src/components/cathedra/GlobalSearchPage.tsx' }
];

const HISTORY_FILE = 'src/scripts/history/compliance-history.json';

function getCodeSnippet(filePath: string, line: number) {
  if (line === 0) return '';
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const start = Math.max(0, line - 2);
    const end = Math.min(lines.length, line + 1);
    return lines.slice(start, end).join('\n');
  } catch (e) {
    return '';
  }
}

function runAudit() {
  const reports: PageCompliance[] = [];

  for (const page of PAGES) {
    const violations: Violation[] = [];
    
    if (!fs.existsSync(page.path)) continue;

    const content = fs.readFileSync(page.path, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // 1. Icon Violation
      if (line.includes("from 'lucide-react'") && !page.path.includes('constants.tsx')) {
        violations.push({
          file: page.path,
          line: lineNum,
          type: 'Icon Violation',
          description: 'Direct import from lucide-react detected.',
          suggestion: "Import icons from '@/constants' (Icons.Name) instead.",
          codeSnippet: getCodeSnippet(page.path, lineNum)
        });
      }

      // 2. Token Violation (Hardcoded colors)
      const hexMatch = line.match(/#[0-9a-fA-F]{3,8}/);
      if (hexMatch && !line.includes('sacredPalette') && !line.includes('// audit-ignore')) {
        violations.push({
          file: page.path,
          line: lineNum,
          type: 'Token Violation',
          description: `Hardcoded Hex color found: ${hexMatch[0]}`,
          suggestion: 'Use Tailwind tokens (text-primary) or sacredPalette.',
          codeSnippet: getCodeSnippet(page.path, lineNum)
        });
      }

      // 3. Layout Violation (Inline styles)
      if (line.includes('style={{') && !line.includes('// audit-ignore')) {
        violations.push({
          file: page.path,
          line: lineNum,
          type: 'Layout Violation',
          description: 'Inline style detected.',
          suggestion: 'Use Tailwind classes or component variants.',
          codeSnippet: getCodeSnippet(page.path, lineNum)
        });
      }
    });

    // 4. Card Violation
    if (content.includes('<div') && content.includes('rounded') && content.includes('shadow') && !content.includes('CathedraCard')) {
      violations.push({
        file: page.path,
        line: 0,
        type: 'Card Violation',
        description: 'Custom card-like div detected.',
        suggestion: 'Replace with <CathedraCard /> for visual consistency.'
      });
    }

    const layout = Math.max(0, 100 - (violations.filter(v => v.type === 'Layout Violation').length * 15));
    const cards = Math.max(0, 100 - (violations.filter(v => v.type === 'Card Violation').length * 25));
    const theme = Math.max(0, 100 - (violations.filter(v => v.type === 'Token Violation').length * 10));
    const tokens = Math.max(0, 100 - (violations.filter(v => v.type === 'Icon Violation').length * 20));
    const overall = (layout + cards + theme + tokens) / 4;

    reports.push({
      name: page.name,
      path: page.path,
      layout,
      cards,
      theme,
      tokens,
      overall,
      violations: violations.slice(0, 10)
    });
  }

  // Handle history and trends
  let history: any[] = [];
  if (fs.existsSync(HISTORY_FILE)) {
    try {
      history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    } catch (e) {
      history = [];
    }
  }

  const lastBuild = history.length > 0 ? history[history.length - 1] : null;

  reports.forEach(report => {
    if (lastBuild) {
      const prevPage = lastBuild.reports.find((p: any) => p.name === report.name);
      if (prevPage) {
        report.trends = {
          overall: report.overall - prevPage.overall,
          layout: report.layout - prevPage.layout,
          cards: report.cards - prevPage.cards,
          theme: report.theme - prevPage.theme,
          tokens: report.tokens - prevPage.tokens,
        };
      }
    }
  });

  // Save to history (keep last 50 builds)
  history.push({
    timestamp: new Date().toISOString(),
    reports: reports.map(({ trends, ...r }) => r)
  });
  if (history.length > 50) history.shift();
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));

  reports.sort((a, b) => a.overall - b.overall);

  return { reports, lastBuild };
}

const { reports, lastBuild } = runAudit();

fs.writeFileSync('compliance-report.json', JSON.stringify(reports, null, 2));

function getTrendIcon(val: number = 0) {
  if (val > 0) return `<span style="color: #10b981;">↑ ${val.toFixed(1)}%</span>`;
  if (val < 0) return `<span style="color: #ef4444;">↓ ${Math.abs(val).toFixed(1)}%</span>`;
  return `<span style="color: #666;">--</span>`;
}

let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Design System Compliance Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fdfcfb; padding: 40px; color: #1a1a1a; }
        .container { max-width: 1100px; margin: 0 auto; }
        .card { background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px rgba(181, 139, 58, 0.08); margin-bottom: 32px; border: 1px solid rgba(181, 139, 58, 0.1); }
        h1 { color: #b58b3a; border-bottom: 2px solid #b58b3a; padding-bottom: 12px; margin-bottom: 40px; }
        h2 { color: #1a1a1a; margin-top: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { text-align: left; padding: 16px; border-bottom: 1px solid #f0f0f0; }
        th { background: #fdfcfb; color: #b58b3a; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; }
        .score { font-weight: 700; font-size: 1.1rem; }
        .score-good { color: #10b981; }
        .score-bad { color: #ef4444; }
        .code-diff { background: #1a1a1a; color: #f8f8f2; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 0.85rem; overflow-x: auto; margin-top: 8px; }
        .suggestion { color: #b58b3a; font-weight: 600; }
        .trend { font-size: 0.8rem; margin-left: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Governança de Design System</h1>
        <p>Relatório Consolidado de Conformidade • ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</p>
        
        <div class="card">
            <h2>Ranking de Páginas & Tendência</h2>
            <table>
                <thead>
                    <tr>
                        <th>Página</th>
                        <th>Layout</th>
                        <th>Cards</th>
                        <th>Tema</th>
                        <th>Tokens</th>
                        <th>Geral</th>
                        <th>Variação</th>
                    </tr>
                </thead>
                <tbody>
                    ${reports.map(r => {
                        const scoreClass = r.overall >= 80 ? 'score-good' : 'score-bad';
                        return `
                        <tr>
                            <td style="font-weight: 600;">${r.name}</td>
                            <td>${r.layout}%</td>
                            <td>${r.cards}%</td>
                            <td>${r.theme}%</td>
                            <td>${r.tokens}%</td>
                            <td class="score ${scoreClass}">${r.overall.toFixed(1)}%</td>
                            <td>${getTrendIcon(r.trends?.overall)}</td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>

        ${reports.map(r => `
        <div class="card">
            <h2>Violações: ${r.name}</h2>
            <p style="font-size: 0.85rem; color: #666; margin-bottom: 16px;">Arquivo: <code>${r.path}</code></p>
            ${r.violations.length === 0 ? '<p style="color: #10b981; font-weight: 600;">✓ Conformidade total atingida.</p>' : `
            <table>
                <thead>
                    <tr>
                        <th style="width: 150px;">Tipo</th>
                        <th style="width: 80px;">Linha</th>
                        <th>Descrição & Contexto</th>
                        <th>Ação Sugerida</th>
                    </tr>
                </thead>
                <tbody>
                    ${r.violations.map(v => `
                    <tr>
                        <td><span style="color: #ef4444; font-weight: 600;">${v.type}</span></td>
                        <td><code>${v.line}</code></td>
                        <td>
                            <div>${v.description}</div>
                            ${v.codeSnippet ? `<pre class="code-diff"><code>${v.codeSnippet}</code></pre>` : ''}
                        </td>
                        <td class="suggestion">${v.suggestion}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
            `}
        </div>
        `).join('')}
    </div>
</body>
</html>
`;
fs.writeFileSync('compliance-report.html', html);

let md = `## 🏛️ Governança de Design System\n\n`;
md += `### Ranking de Conformidade & Tendência\n\n`;
md += `| Página | Layout | Cards | Tema | Tokens | Geral | Tendência |\n`;
md += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: |\n`;
reports.forEach(r => {
    const trendIcon = (r.trends?.overall || 0) > 0 ? '📈' : (r.trends?.overall || 0) < 0 ? '📉' : '➖';
    const statusIcon = r.overall >= 80 ? '✅' : '⚠️';
    md += `| ${r.name} | ${r.layout}% | ${r.cards}% | ${r.theme}% | ${r.tokens}% | ${statusIcon} **${r.overall.toFixed(1)}%** | ${trendIcon} ${r.trends?.overall?.toFixed(1) || 0}% |\n`;
});

md += `\n### 🚩 Checklist de Correção (Top 10 por Página)\n\n`;
reports.forEach(r => {
    if (r.violations.length > 0) {
        md += `#### ${r.name} (\`${r.path}\`)\n`;
        r.violations.forEach(v => {
            md += `- [ ] **${v.type}** (L${v.line}): ${v.description}\n  - 🛠️ **Ação**: ${v.suggestion}\n`;
        });
        md += `\n`;
    }
});

fs.writeFileSync('compliance-report.md', md);
console.log('Relatórios de conformidade gerados com sucesso.');
