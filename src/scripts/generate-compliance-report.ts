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

const ICONS_REGISTRY = 'src/constants.tsx';

function runAudit() {
  const reports: PageCompliance[] = [];

  for (const page of PAGES) {
    const violations: Violation[] = [];
    
    // 1. Check for lucide-react direct imports
    try {
      const output = execSync(`rg "from 'lucide-react'" ${page.path} -n || true`).toString().trim();
      if (output) {
        output.split('\n').forEach(line => {
          const [lineNum, ...content] = line.split(':');
          violations.push({
            file: page.path,
            line: parseInt(lineNum),
            type: 'Icon Violation',
            description: 'Direct import from lucide-react detected.',
            suggestion: `Import icons from '@/constants' (Icons.Name) instead of 'lucide-react'.`
          });
        });
      }
    } catch (e) {}

    // 2. Check for hardcoded colors (Hex/RGB/HSL) outside of theme variables
    try {
      const hexRegex = '#[0-9a-fA-F]{3,8}';
      const output = execSync(`rg -e "${hexRegex}" ${page.path} -n || true`).toString().trim();
      if (output) {
        output.split('\n').forEach(line => {
          const [lineNum, ...content] = line.split(':');
          if (!content.join(':').includes('sacredPalette')) { // Skip if it's the palette itself or comments referencing it
             violations.push({
              file: page.path,
              line: parseInt(lineNum),
              type: 'Token Violation',
              description: 'Hardcoded Hex color found.',
              suggestion: 'Use design system tokens (e.g., text-primary, bg-background) or sacredPalette.'
            });
          }
        });
      }
    } catch (e) {}

    // 3. Check for inline styles
    try {
      const output = execSync(`rg "style=\\{\\{" ${page.path} -n || true`).toString().trim();
      if (output) {
        output.split('\n').forEach(line => {
          const [lineNum, ...content] = line.split(':');
          violations.push({
            file: page.path,
            line: parseInt(lineNum),
            type: 'Layout Violation',
            description: 'Inline style detected.',
            suggestion: 'Move styles to Tailwind classes or component variants.'
          });
        });
      }
    } catch (e) {}

    // 4. Check for standard Card usage
    const content = fs.readFileSync(page.path, 'utf-8');
    if (content.includes('<div') && content.includes('rounded') && content.includes('shadow') && !content.includes('CathedraCard')) {
       violations.push({
          file: page.path,
          line: 0,
          type: 'Card Violation',
          description: 'Hardcoded card-like div found.',
          suggestion: 'Replace custom card divs with <CathedraCard /> component.'
       });
    }

    // Calculate scores (dummy logic for now, based on violations count)
    const baseScore = 100;
    const penalty = violations.length * 5;
    const finalScore = Math.max(0, baseScore - penalty);

    reports.push({
      name: page.name,
      layout: Math.max(0, 100 - (violations.filter(v => v.type === 'Layout Violation').length * 15)),
      cards: Math.max(0, 100 - (violations.filter(v => v.type === 'Card Violation').length * 25)),
      theme: Math.max(0, 100 - (violations.filter(v => v.type === 'Token Violation').length * 10)),
      tokens: Math.max(0, 100 - (violations.filter(v => v.type === 'Icon Violation').length * 20)),
      violations: violations.slice(0, 10) // Top 10
    });
  }

  // Rank pages
  reports.sort((a, b) => {
    const scoreA = (a.layout + a.cards + a.theme + a.tokens) / 4;
    const scoreB = (b.layout + b.cards + b.theme + b.tokens) / 4;
    return scoreA - scoreB; // Worst to Best
  });

  return reports;
}

const results = runAudit();

// Generate JSON
fs.writeFileSync('compliance-report.json', JSON.stringify(results, null, 2));

// Generate HTML
let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Design System Compliance Report</title>
    <style>
        body { font-family: 'Inter', sans-serif; background: #f9f9f9; padding: 40px; }
        .card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 24px; }
        h1 { color: #b58b3a; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #eee; }
        th { background: #f4f4f4; }
        .score { font-weight: bold; }
        .score-good { color: green; }
        .score-bad { color: red; }
        .violation { font-size: 0.9em; color: #666; margin-top: 4px; }
    </style>
</head>
<body>
    <h1>Design System Compliance Report</h1>
    <p>Generated on: ${new Date().toLocaleString()}</p>
    
    <div class="card">
        <h2>Page Rankings (Worst to Best)</h2>
        <table>
            <thead>
                <tr>
                    <th>Page</th>
                    <th>Layout</th>
                    <th>Cards</th>
                    <th>Theme</th>
                    <th>Tokens</th>
                    <th>Overall</th>
                </tr>
            </thead>
            <tbody>
                ${results.map(r => {
                    const overall = ((r.layout + r.cards + r.theme + r.tokens) / 4).toFixed(1);
                    return `
                    <tr>
                        <td>${r.name}</td>
                        <td>${r.layout}%</td>
                        <td>${r.cards}%</td>
                        <td>${r.theme}%</td>
                        <td>${r.tokens}%</td>
                        <td class="score ${parseFloat(overall) > 80 ? 'score-good' : 'score-bad'}">${overall}%</td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>
    </div>

    ${results.map(r => `
    <div class="card">
        <h2>Top 10 Violations: ${r.name}</h2>
        ${r.violations.length === 0 ? '<p>No violations found! Perfect compliance.</p>' : `
        <table>
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Line</th>
                    <th>Description</th>
                    <th>Suggestion</th>
                </tr>
            </thead>
            <tbody>
                ${r.violations.map(v => `
                <tr>
                    <td><strong>${v.type}</strong></td>
                    <td>${v.line}</td>
                    <td>${v.description}</td>
                    <td style="color: #b58b3a;">${v.suggestion}</td>
                </tr>`).join('')}
            </tbody>
        </table>
        `}
    </div>
    `).join('')}
</body>
</html>
`;
fs.writeFileSync('compliance-report.html', html);

// Generate Markdown for PR Comment
let md = `## 🏛️ Design System Compliance Report\n\n`;
md += `### Page Ranking (Worst to Best)\n\n`;
md += `| Page | Layout | Cards | Theme | Tokens | Overall |\n`;
md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
results.forEach(r => {
    const overall = ((r.layout + r.cards + r.theme + r.tokens) / 4).toFixed(1);
    md += `| ${r.name} | ${r.layout}% | ${r.cards}% | ${r.theme}% | ${r.tokens}% | **${overall}%** |\n`;
});

md += `\n### 🚩 Top Violations by Page\n\n`;
results.forEach(r => {
    if (r.violations.length > 0) {
        md += `#### ${r.name}\n`;
        r.violations.forEach(v => {
            md += `- **${v.type}** (Line ${v.line}): ${v.description}\n  - 💡 *Suggestion*: ${v.suggestion}\n`;
        });
        md += `\n`;
    }
});

fs.writeFileSync('compliance-report.md', md);

console.log('Reports generated: compliance-report.json, compliance-report.html, compliance-report.md');
