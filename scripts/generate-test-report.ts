import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Iniciando geração do relatório de testes (TemaDetailPage)...');

const TEST_FILE_PATTERN = 'src/components/cathedra/TemaDetailPage';
const OUTPUT_JSON = 'test-results.json';
const OUTPUT_JUNIT = 'junit.xml';
const OUTPUT_HTML = 'public/test-report.html';
const OUTPUT_MD = 'public/test-report.md';

try {
  // 1. Execute tests and generate multiple formats
  console.log('  - Executando testes e coletando métricas detalhadas...');
  try {
    // Vitest multi-reporter syntax: --reporter=json --reporter=junit --reporter=default
    execSync(`npx vitest run ${TEST_FILE_PATTERN} --reporter=json --reporter=junit --reporter=default --outputFile.json=${OUTPUT_JSON} --outputFile.junit=${OUTPUT_JUNIT}`, { stdio: 'inherit' });
  } catch (e: any) {
    // Failures are expected, continue to generate report
  }

  if (!fs.existsSync(OUTPUT_JSON)) {
    console.error('❌ Falha ao gerar arquivo de resultados JSON.');
    process.exit(1);
  }

  // 2. Read and Process results
  const results = JSON.parse(fs.readFileSync(OUTPUT_JSON, 'utf-8'));
  
  const stats = {
    total: results.numTotalTests,
    passed: results.numPassedTests,
    failed: results.numFailedTests,
    startTime: results.startTime,
    duration: results.testResults.reduce((acc: number, f: any) => acc + (f.endTime - f.startTime), 0),
  };

  const processedResults = results.testResults.flatMap((file: any) => {
    return file.assertionResults.map((assertion: any) => {
      const consoleLogs = file.console || [];
      
      // Aggregate stats from all logs in the file that belong to this test context
      // (Vitest doesn't always map console logs perfectly to assertionResults in the JSON output)
      const testStats = consoleLogs
        .filter((l: any) => l.origin === 'stdout' && (l.content.includes('[STATS]') || l.content.includes('STATS:')))
        .map((l: any) => {
          try {
            const raw = l.content.includes('[STATS]') 
              ? l.content.replace('[STATS] ', '') 
              : l.content.replace('STATS: ', '');
            return JSON.parse(raw);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      // Merge stats if multiple entries found
      const mergedStats = testStats.reduce((acc: any, curr: any) => {
        acc.calls = (acc.calls || 0) + (curr.calls || curr.bible || 0);
        acc.tabs = { ...(acc.tabs || {}), ...(curr.tabs || { bible: curr.bible }) };
        return acc;
      }, { calls: 0, tabs: {} });

      return {
        title: assertion.title,
        status: assertion.status,
        ancestorTitles: assertion.ancestorTitles,
        failureMessages: assertion.failureMessages,
        duration: assertion.duration,
        stats: mergedStats.calls > 0 ? mergedStats : null,
        fileName: path.basename(file.name)
      };
    });
  });


  // 3. Generate Markdown Report
  let md = `# Relatório de Integração - TemaDetailPage\n\n`;
  md += `**Status:** ${stats.failed === 0 ? '✅ APROVADO' : '❌ PENDENTE'}\n`;
  md += `- **Data:** ${new Date().toLocaleString()}\n`;
  md += `- **Total:** ${stats.total}\n`;
  md += `- **Sucessos:** ${stats.passed}\n`;
  md += `- **Falhas:** ${stats.failed}\n`;
  md += `- **Duração:** ${(stats.duration / 1000).toFixed(2)}s\n\n`;

  md += `## 🏎️ Race Conditions & Performance\n`;
  processedResults.filter(r => r.title.match(/race|switch|rapid|abort/i)).forEach(r => {
    md += `- ${r.status === 'passed' ? '✅' : '❌'} **${r.title}** (${r.fileName})\n`;
    if (r.stats) md += `  - *Mocks:* ${r.stats.calls} chamadas | Tabs: ${JSON.stringify(r.stats.tabs)}\n`;
  });

  md += `\n## 🔄 Retry & Error Flows\n`;
  processedResults.filter(r => r.title.match(/retry|again|error|fail/i)).forEach(r => {
    md += `- ${r.status === 'passed' ? '✅' : '❌'} **${r.title}**\n`;
  });

  md += `\n## ⌨️ Accessibility & ARIA\n`;
  processedResults.filter(r => r.title.match(/accessibility|role|aria|keyboard/i)).forEach(r => {
    md += `- ${r.status === 'passed' ? '✅' : '❌'} **${r.title}**\n`;
  });

  if (stats.failed > 0) {
    md += `\n## ❌ Detalhes das Falhas\n`;
    processedResults.filter(r => r.status === 'failed').forEach(r => {
      md += `### ${r.title}\n`;
      md += `**Arquivo:** ${r.fileName}\n`;
      if (r.failureMessages && r.failureMessages.length > 0) {
        md += `\`\`\`\n${r.failureMessages.join('\n')}\n\`\`\`\n`;
      }
    });
  }

  fs.writeFileSync(OUTPUT_MD, md);

  // 4. Generate HTML Report (simple wrapping of MD or standalone)
  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Test Report - TemaDetailPage</title>
    <style>
        body { font-family: sans-serif; line-height: 1.6; max-width: 1000px; margin: 0 auto; padding: 20px; background: #f4f4f9; }
        .card { background: white; padding: 20px; border-radius: 8px; shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; border-left: 5px solid #eee; }
        .passed { border-left-color: #4caf50; }
        .failed { border-left-color: #f44336; }
        pre { background: #272822; color: #f8f8f2; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 12px; }
        .stats-badge { background: #e0e0e0; padding: 2px 8px; border-radius: 10px; font-size: 11px; }
        h1, h2, h3 { color: #333; }
        .summary { display: flex; gap: 20px; margin-bottom: 30px; }
        .summary-item { flex: 1; background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .val { font-size: 24px; font-weight: bold; display: block; }
    </style>
</head>
<body>
    <h1>Relatório de Testes: TemaDetailPage</h1>
    <div class="summary">
        <div class="summary-item">Total <span class="val">${stats.total}</span></div>
        <div class="summary-item" style="color: green">Passou <span class="val">${stats.passed}</span></div>
        <div class="summary-item" style="color: red">Falhou <span class="val">${stats.failed}</span></div>
    </div>

    <h2>Detalhes dos Testes</h2>
    ${processedResults.map(r => `
        <div class="card ${r.status}">
            <strong>${r.status === 'passed' ? '✅' : '❌'} ${r.title}</strong>
            <div style="font-size: 12px; color: #666; margin: 5px 0;">
                ${r.fileName} | Duração: ${r.duration}ms 
                ${r.stats ? `<span class="stats-badge">Mocks: ${r.stats.calls} chamadas</span>` : ''}
            </div>
            ${r.status === 'failed' ? `<pre>${r.failureMessages.join('\n')}</pre>` : ''}
        </div>
    `).join('')}
</body>
</html>
  `;
  fs.writeFileSync(OUTPUT_HTML, html);

  console.log('\n==================================================');
  console.log('✅ RELATÓRIO GERADO COM SUCESSO!');
  console.log(`- JSON: ${OUTPUT_JSON}`);
  console.log(`- JUnit: ${OUTPUT_JUNIT}`);
  console.log(`- HTML: ${OUTPUT_HTML}`);
  console.log(`- Markdown: ${OUTPUT_MD}`);
  console.log('==================================================\n');

} catch (error: any) {
  console.error('❌ Erro crítico ao gerar relatório:', error.message);
  process.exit(1);
}
