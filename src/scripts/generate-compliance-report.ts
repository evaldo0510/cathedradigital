import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface Violation {
  file: string;
  line: number;
  type: string;
  description: string;
  suggestion: string;
}

interface PageCompliance {
  name: string;
  layout: number;
  cards: number;
  theme: number;
  tokens: number;
  violations: Violation[];
}

const PAGES = [
  { name: 'Home', path: 'src/components/cathedra/HomeMainContent.tsx' },
  { name: 'Bible', path: 'src/components/cathedra/Bible.tsx' },
  { name: 'Catechism', path: 'src/components/cathedra/Catechism.tsx' },
  { name: 'Library', path: 'src/components/cathedra/BibliotecaPage.tsx' },
  { name: 'Documents', path: 'src/components/cathedra/DocumentViewer.tsx' },
  { name: 'Search', path: 'src/components/cathedra/GlobalSearchPage.tsx' }
];

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
          suggestion: "Import icons from '@/constants' (Icons.Name) instead."
        });
      }

      // 2. Token Violation (Hardcoded colors)
      const hexMatch = line.match(/#[0-9a-fA-F]{3,8}/);
      if (hexMatch && !line.includes('sacredPalette')) {
        violations.push({
          file: page.path,
          line: lineNum,
          type: 'Token Violation',
          description: `Hardcoded Hex color found: ${hexMatch[0]}`,
          suggestion: 'Use Tailwind tokens (text-primary) or sacredPalette.'
        });
      }

      // 3. Layout Violation (Inline styles)
      if (line.includes('style={{')) {
        violations.push({
          file: page.path,
          line: lineNum,
          type: 'Layout Violation',
          description: 'Inline style detected.',
          suggestion: 'Use Tailwind classes or component variants.'
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

    reports.push({
      name: page.name,
      layout: Math.max(0, 100 - (violations.filter(v => v.type === 'Layout Violation').length * 15)),
      cards: Math.max(0, 100 - (violations.filter(v => v.type === 'Card Violation').length * 25)),
      theme: Math.max(0, 100 - (violations.filter(v => v.type === 'Token Violation').length * 10)),
      tokens: Math.max(0, 100 - (violations.filter(v => v.type === 'Icon Violation').length * 20)),
      violations: violations.slice(0, 10)
    });
  }

  reports.sort((a, b) => {
    const scoreA = (a.layout + a.cards + a.theme + a.tokens) / 4;
    const scoreB = (b.layout + b.cards + b.theme + b.tokens) / 4;
    return scoreA - scoreB;
  });

  return reports;
}

const results = runAudit();

fs.writeFileSync('compliance-report.json', JSON.stringify(results, null, 2));

let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Design System Compliance Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fdfcfb; padding: 40px; color: #1a1a1a; }
        .container { max-width: 1000px; margin: 0 auto; }
        .card { background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px rgba(181, 139, 58, 0.08); margin-bottom: 32px; border: 1px solid rgba(181, 139, 58, 0.1); }
        h1 { color: #b58b3a; font-family: "Cinzel", serif; border-bottom: 2px solid #b58b3a; padding-bottom: 12px; margin-bottom: 40px; }
        h2 { font-family: "Cinzel", serif; color: #1a1a1a; margin-top: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { text-align: left; padding: 16px; border-bottom: 1px solid #f0f0f0; }
        th { background: #fdfcfb; color: #b58b3a; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; }
        .score { font-weight: 700; font-size: 1.1rem; }
        .score-good { color: #10b981; }
        .score-bad { color: #ef4444; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
        .violation-type { color: #ef4444; font-weight: 600; }
        .suggestion { color: #b58b3a; font-style: italic; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Governança de Design System</h1>
        <p>Relatório Consolidado de Conformidade • ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</p>
        
        <div class="card">
            <h2>Ranking de Páginas</h2>
            <table>
                <thead>
                    <tr>
                        <th>Página</th>
                        <th>Layout</th>
                        <th>Cards</th>
                        <th>Tema</th>
                        <th>Tokens</th>
                        <th>Geral</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.map(r => {
                        const overall = ((r.layout + r.cards + r.theme + r.tokens) / 4).toFixed(1);
                        const scoreClass = parseFloat(overall) >= 80 ? 'score-good' : 'score-bad';
                        return `
                        <tr>
                            <td style="font-weight: 600;">${r.name}</td>
                            <td>${r.layout}%</td>
                            <td>${r.cards}%</td>
                            <td>${r.theme}%</td>
                            <td>${r.tokens}%</td>
                            <td class="score ${scoreClass}">${overall}%</td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>

        ${results.map(r => `
        <div class="card">
            <h2>Violações: ${r.name}</h2>
            ${r.violations.length === 0 ? '<p style="color: #10b981; font-weight: 600;">✓ Conformidade total atingida.</p>' : `
            <table>
                <thead>
                    <tr>
                        <th style="width: 150px;">Tipo</th>
                        <th style="width: 80px;">Linha</th>
                        <th>Descrição</th>
                        <th>Ação Sugerida</th>
                    </tr>
                </thead>
                <tbody>
                    ${r.violations.map(v => `
                    <tr>
                        <td><span class="violation-type">${v.type}</span></td>
                        <td><code>${v.line}</code></td>
                        <td>${v.description}</td>
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
md += `### Ranking de Conformidade por Página\n\n`;
md += `| Página | Layout | Cards | Tema | Tokens | Geral |\n`;
md += `| :--- | :---: | :---: | :---: | :---: | :---: |\n`;
results.forEach(r => {
    const overall = ((r.layout + r.cards + r.theme + r.tokens) / 4).toFixed(1);
    const icon = parseFloat(overall) >= 80 ? '✅' : '⚠️';
    md += `| ${r.name} | ${r.layout}% | ${r.cards}% | ${r.theme}% | ${r.tokens}% | ${icon} **${overall}%** |\n`;
});

md += `\n### 🚩 Top Violações Identificadas\n\n`;
results.forEach(r => {
    if (r.violations.length > 0) {
        md += `#### ${r.name}\n`;
        r.violations.forEach(v => {
            md += `- **${v.type}** (Linha ${v.line}): ${v.description}\n  - 💡 *Sugerido*: ${v.suggestion}\n`;
        });
        md += `\n`;
    }
});

fs.writeFileSync('compliance-report.md', md);
console.log('Relatórios de conformidade gerados com sucesso.');
