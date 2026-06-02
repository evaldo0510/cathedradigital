import fs from 'fs';
import path from 'path';

interface UXMetrics {
  route: string;
  viewport: string;
  totalPageHeight: number;
  heightToNextCTA: number;
  viewportHeight: number;
}

interface ValidationResult {
  route: string;
  viewport: string;
  hasCuts: boolean;
  hasOverlaps: boolean;
  issues: string[];
}

interface ReportData {
  metrics: UXMetrics[];
  validations: ValidationResult[];
  timestamp: string;
}

const REPORT_DIR = path.join(process.cwd(), 'reports');
const CURRENT_REPORT_PATH = path.join(REPORT_DIR, 'mobile-ux-metrics.json');
const BASELINE_REPORT_PATH = path.join(REPORT_DIR, 'baseline-mobile-ux-metrics.json');
const OUTPUT_HTML_PATH = path.join(REPORT_DIR, 'mobile-ux-report.html');

function formatDiff(current: number, baseline: number, threshold = 10) {
  if (baseline === 0) return 'N/A';
  const diff = ((current - baseline) / baseline) * 100;
  
  // Logic for UI indicators
  const isBad = diff > threshold; // Worsening if height increases significantly
  const color = Math.abs(diff) < 1 ? '#10b981' : (isBad ? '#ef4444' : '#3b82f6');
  const arrow = diff > 0 ? '↑' : (diff < 0 ? '↓' : '');
  
  return `<span style="color: ${color}; font-weight: bold;">${arrow} ${Math.abs(diff).toFixed(1)}%</span>`;
}

async function generateReport() {
  if (!fs.existsSync(CURRENT_REPORT_PATH)) {
    console.error('Current metrics not found at ' + CURRENT_REPORT_PATH);
    return;
  }

  const currentData: ReportData = JSON.parse(fs.readFileSync(CURRENT_REPORT_PATH, 'utf8'));
  let baselineData: ReportData | null = null;

  if (fs.existsSync(BASELINE_REPORT_PATH)) {
    baselineData = JSON.parse(fs.readFileSync(BASELINE_REPORT_PATH, 'utf8'));
  }

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Mobile UX & Layout Integrity Report</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #fcfcfc; color: #1f2937; padding: 2rem; max-width: 1200px; margin: auto; }
        header { border-bottom: 2px solid #e5e7eb; margin-bottom: 2rem; padding-bottom: 1rem; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 3rem; }
        .card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .card h3 { margin-top: 0; color: #374151; font-size: 1.1rem; }
        table { width: 100%; border-collapse: collapse; margin-top: 1rem; background: white; border-radius: 8px; overflow: hidden; }
        th, td { text-align: left; padding: 0.75rem 1rem; border-bottom: 1px solid #f3f4f6; }
        th { background: #f9fafb; font-weight: 600; color: #4b5563; }
        .badge { display: inline-block; padding: 0.25rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: bold; }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-danger { background: #fee2e2; color: #991b1b; }
        .badge-warning { background: #fef9c3; color: #854d0e; }
        .issue-list { list-style: none; padding: 0; margin: 0; font-size: 0.85rem; color: #991b1b; }
        .issue-item { margin-bottom: 0.25rem; }
        .metrics-table td { font-family: monospace; }
        .diff { font-size: 0.8rem; margin-left: 0.5rem; }
    </style>
</head>
<body>
    <header>
        <h1>📱 Mobile UX & Layout Integrity</h1>
        <p>Relatório de Auditoria Visual e Ergonômica • ${new Date(currentData.timestamp).toLocaleString()}</p>
    </header>

    <section>
        <h2>📏 Comparativo de Métricas (Antes vs Depois)</h2>
        <div class="card">
            <table class="metrics-table">
                <thead>
                    <tr>
                        <th>Página</th>
                        <th>Viewport</th>
                        <th>Comprimento Total (px)</th>
                        <th>Altura até CTA (px)</th>
                        <th>Diff %</th>
                    </tr>
                </thead>
                <tbody>
                    ${currentData.metrics.map(m => {
                      const b = baselineData?.metrics.find(bm => bm.route === m.route && bm.viewport === m.viewport);
                      return `
                        <tr>
                            <td><code>${m.route}</code></td>
                            <td><code>${m.viewport}</code></td>
                            <td>
                                ${m.totalPageHeight}
                                ${b ? `<span class="diff">${formatDiff(m.totalPageHeight, b.totalPageHeight)}</span>` : ''}
                            </td>
                            <td>
                                ${m.heightToNextCTA === -1 ? 'Sem CTA' : m.heightToNextCTA}
                                ${b && b.heightToNextCTA !== -1 && m.heightToNextCTA !== -1 ? `<span class="diff">${formatDiff(m.heightToNextCTA, b.heightToNextCTA)}</span>` : ''}
                            </td>
                            <td>
                                ${b ? formatDiff(m.totalPageHeight + m.heightToNextCTA, b.totalPageHeight + b.heightToNextCTA) : 'Baseline N/A'}
                            </td>
                        </tr>
                      `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    </section>

    <section style="margin-top: 3rem;">
        <h2>🔍 Verificação de Integridade (Catechism)</h2>
        <div class="grid">
            ${currentData.validations.map(v => `
                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3>${v.viewport}</h3>
                        <span class="badge ${v.issues.length === 0 ? 'badge-success' : 'badge-danger'}">
                            ${v.issues.length === 0 ? 'EXCELENTE' : 'COM ATRITOS'}
                        </span>
                    </div>
                    <p style="font-size: 0.9rem; color: #6b7280;">Rota: <code>${v.route}</code></p>
                    
                    <div style="margin-top: 1rem;">
                        <strong>Status:</strong>
                        <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap;">
                            <span class="badge ${v.hasCuts ? 'badge-danger' : 'badge-success'}">Cortes: ${v.hasCuts ? 'SIM' : 'NÃO'}</span>
                            <span class="badge ${v.hasOverlaps ? 'badge-danger' : 'badge-success'}">Sobreposições: ${v.hasOverlaps ? 'SIM' : 'NÃO'}</span>
                            <span class="badge ${(v as any).smallTouchArea ? 'badge-danger' : 'badge-success'}">Área de Toque (44px): ${(v as any).smallTouchArea ? 'FALHA' : 'OK'}</span>
                        </div>
                    </div>

                    ${v.issues.length > 0 ? `
                        <div style="margin-top: 1rem;">
                            <strong>Atritos Identificados:</strong>
                            <ul class="issue-list">
                                ${v.issues.map(i => `<li class="issue-item">⚠️ ${i}</li>`).join('')}
                            </ul>
                        </div>
                    ` : '<p style="margin-top: 1rem; color: #059669; font-size: 0.9rem;">✓ Nenhum erro de renderização detectado.</p>'}
                </div>
            `).join('')}
        </div>
    </section>

    <footer style="margin-top: 4rem; text-align: center; color: #9ca3af; font-size: 0.8rem;">
        CATHEDRA ARCHITECTURE • TASK MASTER AUDIT SYSTEM
    </footer>
</body>
</html>
  `;

  fs.writeFileSync(OUTPUT_HTML_PATH, html);
  console.log('Report generated at ' + OUTPUT_HTML_PATH);
}

generateReport();
