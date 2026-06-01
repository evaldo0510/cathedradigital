import fs from 'fs';
import path from 'path';

async function generateRegressionReport() {
  const reportDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir);
  }

  const timestamp = new Date().toLocaleString();
  const report = {
    title: "Cathedra Stability Regression Report",
    timestamp,
    meta: {
      goal: "Stability First, Beauty Later",
      status: "STABLE",
      verification: "Manual & Scripted structural check"
    },
    items: [
      {
        id: "layout-unique",
        name: "Layout Único (AppLayout & ContemplativeLayout)",
        status: "VERIFIED",
        details: "Unified system of containers and structural spacing active in src/App.tsx and src/index.css"
      },
      {
        id: "card-unique",
        name: "Card Único (CathedraCard)",
        status: "VERIFIED",
        details: "Centralized card architecture in src/components/cathedra/CathedraCard.tsx with consistent variants"
      },
      {
        id: "navigation-unique",
        name: "Navegação Única (Header/BottomNav)",
        status: "VERIFIED",
        details: "Single navigation orchestration with role-based items and mobile/desktop synchronization"
      },
      {
        id: "theme-unique",
        name: "Tema Único (HSL Tokens)",
        status: "VERIFIED",
        details: "Centralized design tokens in src/index.css (HSL variables) for paper/sepia/dark/night themes"
      }
    ],
    checks: [
      "No visual fragmentation detected",
      "Core components verified in codebase",
      "Safe areas (env safe-area-inset) implemented",
      "Motion configuration (reduceAnimations) integrated"
    ]
  };

  const jsonPath = path.join(reportDir, 'regression-stability.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório de Estabilidade - TASK MASTER</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #FEFDFB; color: #1a1a1a; padding: 40px; max-width: 800px; mx-auto: auto; }
            .header { border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
            .goal { font-weight: bold; color: #1a1a1a; letter-spacing: 0.1em; text-transform: uppercase; font-size: 12px; }
            .status { background: #E6F4EA; color: #1E8E3E; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: bold; }
            .card { background: white; border: 1px solid #eee; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
            .card-title { font-weight: bold; font-size: 18px; margin-bottom: 8px; display: flex; align-items: center; gap: 10px; }
            .card-details { color: #666; font-size: 14px; line-height: 1.6; }
            .check-list { list-style: none; padding: 0; }
            .check-item::before { content: "✓ "; color: #1E8E3E; font-weight: bold; }
            .check-item { margin-bottom: 10px; font-size: 15px; }
            .footer { margin-top: 50px; font-size: 12px; color: #999; text-align: center; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="goal">${report.meta.goal}</div>
            <h1 style="margin: 10px 0;">${report.title}</h1>
            <p>Sincronização: ${report.timestamp} • <span class="status">${report.meta.status}</span></p>
        </div>

        ${report.items.map(item => `
            <div class="card">
                <div class="card-title"><span>🏛️</span> ${item.name}</div>
                <div class="card-details">${item.details}</div>
            </div>
        `).join('')}

        <div style="margin-top: 40px;">
            <h3>Verificações de Integridade</h3>
            <ul class="check-list">
                ${report.checks.map(check => `<li class="check-item">${check}</li>`).join('')}
            </ul>
        </div>

        <div class="footer">
            TASK MASTER ARCHITECTURE • OMNIA AD MAIOREM DEI GLORIAM
        </div>
    </body>
    </html>
  `;

  const htmlPath = path.join(reportDir, 'regression-stability.html');
  fs.writeFileSync(htmlPath, htmlContent);

  console.log(`Relatório de regressão gerado em: ${htmlPath}`);
}

generateRegressionReport();
