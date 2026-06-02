import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { z } from 'zod';

interface PageCompliance {
  name: string;
  path: string;
  layout: number;
  cards: number;
  theme: number;
  tokens: number;
  overall: number;
  violations: Violation[];
  trends?: any;
}

interface Violation {
  file: string;
  line: number;
  type: string;
  description: string;
  suggestion: string;
  codeSnippet?: string;
}

const HISTORY_FILE = 'src/scripts/history/compliance-history.json';
const CONFIG_FILE = 'compliance-config.yml';
const PAGES = [
  { name: 'Home', path: 'src/components/cathedra/HomeMainContent.tsx' },
  { name: 'Bible', path: 'src/components/cathedra/Bible.tsx' },
  { name: 'Catechism', path: 'src/components/cathedra/Catechism.tsx' },
  { name: 'Library', path: 'src/components/cathedra/BibliotecaPage.tsx' },
  { name: 'Documents', path: 'src/components/cathedra/DocumentViewer.tsx' },
  { name: 'Search', path: 'src/components/cathedra/GlobalSearchPage.tsx' }
];

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

  history.push({
    timestamp: new Date().toISOString(),
    reports: reports.map(({ trends, ...r }) => r)
  });
  if (history.length > 50) history.shift();
  fs.mkdirSync(path.dirname(HISTORY_FILE), { recursive: true });
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));

  reports.sort((a, b) => a.overall - b.overall);

  return { reports, lastBuild, history };
}

const { reports, lastBuild, history } = runAudit();

// Schema Validation for compliance-config.yml
const ThresholdSchema = z.number().min(0).max(100);

const PageThresholdsSchema = z.object({
  layout: ThresholdSchema.optional(),
  cards: ThresholdSchema.optional(),
  theme: ThresholdSchema.optional(),
  tokens: ThresholdSchema.optional(),
  overall: ThresholdSchema.optional(),
});

const ComplianceConfigSchema = z.object({
  compliance_thresholds: z.object({
    overall: ThresholdSchema,
    pages: z.record(z.string(), PageThresholdsSchema).optional(),
    metrics: z.object({
      layout: ThresholdSchema.optional(),
      cards: ThresholdSchema.optional(),
      theme: ThresholdSchema.optional(),
      tokens: ThresholdSchema.optional(),
    }).optional(),
  }),
});

// Load and Validate Config
let config: z.infer<typeof ComplianceConfigSchema> = { compliance_thresholds: { overall: 80 } };

if (fs.existsSync(CONFIG_FILE)) {
  try {
    const rawConfig = yaml.load(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    const result = ComplianceConfigSchema.safeParse(rawConfig);
    
    if (!result.success) {
      console.error('❌ ERRO DE VALIDAÇÃO: compliance-config.yml possui erros de esquema:');
      result.error.issues.forEach(issue => {
        console.error(`   - [${issue.path.join('.')}] : ${issue.message}`);
      });
      process.exit(1);
    }
    config = result.data;
  } catch (e) {
    console.error(`❌ ERRO: Falha ao carregar ${CONFIG_FILE}. Verifique se o formato YAML está correto.`);
    process.exit(1);
  }
}

fs.writeFileSync('compliance-report.json', JSON.stringify(reports, null, 2));

// Generate Summary.json (Requested for easier integrations)
const summary = {
  last_updated: new Date().toISOString(),
  overall_score: reports.reduce((acc, r) => acc + r.overall, 0) / reports.length,
  page_metrics: reports.map(r => ({
    name: r.name,
    overall: r.overall,
    variation: r.trends?.overall || 0,
    metrics: {
      layout: r.layout,
      cards: r.cards,
      theme: r.theme,
      tokens: r.tokens
    }
  })),
  history_trends: history.map((h: any) => ({
    date: h.timestamp,
    score: h.reports.reduce((acc: number, r: any) => acc + r.overall, 0) / h.reports.length
  })).slice(-10)
};
fs.writeFileSync('summary.json', JSON.stringify(summary, null, 2));

function getTrendIcon(val: number = 0) {
  if (val > 0) return `<span style="color: #10b981;">↑ ${val.toFixed(1)}%</span>`;
  if (val < 0) return `<span style="color: #ef4444;">↓ ${Math.abs(val).toFixed(1)}%</span>`;
  return `<span style="color: #666;">--</span>`;
}

// HTML Dashboard with Expandable Diffs and History Chart
let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Design System Governance Dashboard</title>
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
        details summary { cursor: pointer; color: #b58b3a; font-weight: 600; outline: none; }
        .history-chart { display: flex; align-items: flex-end; height: 100px; gap: 4px; margin-top: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .bar { background: #b58b3a; width: 20px; border-radius: 4px 4px 0 0; transition: height 0.3s; position: relative; }
        .bar:hover { background: #1a1a1a; }
        .bar::after { content: attr(data-score) "%"; position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 10px; opacity: 0; }
        .bar:hover::after { opacity: 1; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Dashboard de Governança Digital</h1>
        
        <div class="card">
            <h2>Histórico de Conformidade (Últimos Builds)</h2>
            <div class="history-chart">
                ${summary.history_trends.map(h => `
                    <div class="bar" style="height: ${h.score}%" data-score="${h.score.toFixed(1)}"></div>
                `).join('')}
            </div>
            <p style="font-size: 0.8rem; color: #666; margin-top: 10px;">Médias globais por build para acompanhamento de tendência.</p>
        </div>

        <div class="card">
            <h2>Ranking de Páginas & Variação vs Último Build</h2>
            <table>
                <thead>
                    <tr>
                        <th>Página</th>
                        <th>Geral</th>
                        <th>Variação</th>
                        <th>Tokens</th>
                        <th>Layout</th>
                        <th>Tema</th>
                    </tr>
                </thead>
                <tbody>
                    ${reports.map(r => {
                        const scoreClass = r.overall >= (config.compliance_thresholds.pages?.[r.name]?.overall || config.compliance_thresholds.overall) ? 'score-good' : 'score-bad';
                        return `
                        <tr>
                            <td style="font-weight: 600;">${r.name}</td>
                            <td class="score ${scoreClass}">${r.overall.toFixed(1)}%</td>
                            <td>${getTrendIcon(r.trends?.overall)}</td>
                            <td>${r.tokens}%</td>
                            <td>${r.layout}%</td>
                            <td>${r.theme}%</td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>

        ${reports.map(r => `
        <div class="card">
            <h2>Página: ${r.name}</h2>
            <p style="font-size: 0.85rem; color: #666; margin-bottom: 16px;">Localização: <code>${r.path}</code></p>
            ${r.violations.length === 0 ? '<p style="color: #10b981; font-weight: 600;">✓ 100% de conformidade detectada.</p>' : `
            <table>
                <thead>
                    <tr>
                        <th style="width: 180px;">Violação</th>
                        <th>Ação & Contexto Detalhado</th>
                    </tr>
                </thead>
                <tbody>
                    ${r.violations.map(v => `
                    <tr>
                        <td><span style="color: #ef4444; font-weight: 600;">${v.type}</span><br><code style="font-size: 0.75rem;">Linha: ${v.line}</code></td>
                        <td>
                            <details>
                                <summary>Visualizar Diff e Sugestão</summary>
                                <div style="margin-top: 10px;">
                                    <p class="suggestion">💡 Sugestão: ${v.suggestion}</p>
                                    ${v.codeSnippet ? `<pre class="code-diff"><code>${v.codeSnippet}</code></pre>` : ''}
                                </div>
                            </details>
                        </td>
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

// Markdown for PR
let md = `## 🏛️ Governança de Design System (Audit Summary)\n\n`;
md += `**Score Geral: ${summary.overall_score.toFixed(1)}%** | Última Auditoria: ${new Date().toLocaleDateString()}\n\n`;
md += `| Página | Geral | Tendência | Tokens | Layout | Status |\n`;
md += `| :--- | :---: | :---: | :---: | :---: | :---: |\n`;
reports.forEach(r => {
    const trend = (r.trends?.overall || 0) > 0 ? '📈' : (r.trends?.overall || 0) < 0 ? '📉' : '➖';
    const limit = config.compliance_thresholds.pages?.[r.name]?.overall || config.compliance_thresholds.overall;
    const status = r.overall >= limit ? '✅' : '❌';
    md += `| ${r.name} | **${r.overall.toFixed(1)}%** | ${trend} ${r.trends?.overall?.toFixed(1) || 0}% | ${r.tokens}% | ${r.layout}% | ${status} |\n`;
});

md += `\n### 🚩 Checklist de Ação (Violações Priorizadas)\n\n`;
reports.forEach(r => {
    if (r.violations.length > 0) {
        md += `<details>\n<summary><b>${r.name}</b> (${r.violations.length} problemas encontrados)</summary>\n\n`;
        md += `| Linha | Tipo | Descrição | Ação Sugerida |\n`;
        md += `| :--- | :--- | :--- | :--- |\n`;
        r.violations.forEach(v => {
            md += `| ${v.line} | \`${v.type}\` | ${v.description} | ${v.suggestion} |\n`;
        });
        md += `\n</details>\n\n`;
    }
});

fs.writeFileSync('compliance-report.md', md);
console.log('Relatórios e Dashboard gerados com sucesso.');
