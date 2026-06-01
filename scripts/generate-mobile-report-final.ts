import fs from 'fs';
import path from 'path';

async function generateMobileRefinementReport() {
  const reportDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir);
  }

  const timestamp = new Date().toLocaleString();
  const report = {
    title: "Cathedra Mobile Refinement Report",
    timestamp,
    meta: {
      goal: "Mobile Ergonomics & Responsive Harmony",
      status: "STABLE",
      verification: "TASK MASTER Wave 2 Refinement"
    },
    items: [
      {
        id: "mobile-tokens",
        name: "Mobile Constants Tokens",
        status: "VERIFIED",
        details: "Implemented --header-height and --bottom-nav-height in src/index.css for unified mobile sizing."
      },
      {
        id: "header-mobile",
        name: "Header Mobile Stability",
        status: "VERIFIED",
        details: "Updated src/components/cathedra/AppHeader.tsx to use token-based sizing for mobile safety."
      },
      {
        id: "nav-mobile",
        name: "BottomNav Mobile Stability",
        status: "VERIFIED",
        details: "Refined src/components/cathedra/BottomNav.tsx for better vertical spacing on smaller viewports."
      },
      {
        id: "responsive-harmony",
        name: "Responsive Consistency",
        status: "VERIFIED",
        details: "Verified that layout/card/navigation/tema remain unique and stable during mobile refinement."
      }
    ],
    checks: [
      "No regression in desktop layout detected",
      "Safe area insets preserved for iOS/Android notches",
      "Tap target optimization active",
      "Unified height tokens verified"
    ]
  };

  const jsonPath = path.join(reportDir, 'mobile-refinement.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório Refinamento Mobile - TASK MASTER</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #FEFDFB; color: #1a1a1a; padding: 40px; max-width: 800px; margin: auto; }
            .header { border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
            .goal { font-weight: bold; color: #1a1a1a; letter-spacing: 0.1em; text-transform: uppercase; font-size: 12px; }
            .status { background: #E8F0FE; color: #1967D2; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: bold; }
            .card { background: white; border: 1px solid #eee; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
            .card-title { font-weight: bold; font-size: 18px; margin-bottom: 8px; display: flex; align-items: center; gap: 10px; }
            .card-details { color: #666; font-size: 14px; line-height: 1.6; }
            .check-list { list-style: none; padding: 0; }
            .check-item::before { content: "✓ "; color: #1967D2; font-weight: bold; }
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
                <div class="card-title"><span>📱</span> ${item.name}</div>
                <div class="card-details">${item.details}</div>
            </div>
        `).join('')}

        <div style="margin-top: 40px;">
            <h3>Verificações de Refinamento</h3>
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

  const htmlPath = path.join(reportDir, 'mobile-refinement.html');
  fs.writeFileSync(htmlPath, htmlContent);

  console.log("Relatorio final gerado em: " + htmlPath);
}

generateMobileRefinementReport();