import fs from 'fs';
import { execSync } from 'child_process';

/**
 * Script para sincronizar e rodar apenas os testes que falharam no CI.
 * Procura por playwright-report/results.json (deve ser baixado do CI ou gerado localmente).
 */
function syncAndRun() {
  const resultsPath = 'playwright-report/results.json';
  
  if (!fs.existsSync(resultsPath)) {
    console.error('❌ Arquivo playwright-report/results.json não encontrado.');
    console.log('Baixe os artefatos da execução do CI e coloque-os na pasta playwright-report/.');
    process.exit(1);
  }

  try {
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    const failedTests = [];

    results.suites.forEach(suite => {
      suite.specs.forEach(spec => {
        spec.tests.forEach(test => {
          if (test.status === 'unexpected' || test.status === 'failed') {
            // Adiciona o nome do arquivo e o título do teste
            failedTests.push(`${spec.file}:${spec.line}`);
          }
        });
      });
    });

    if (failedTests.length === 0) {
      console.log('✅ Nenhum teste falho encontrado no relatório.');
      return;
    }

    console.log(`🚀 Reexecutando ${failedTests.length} testes falhos...`);
    const cmd = `HEADLESS=true CI=true VITE_SWIPE_THRESHOLD=80 VITE_SWIPE_RATIO=2.5 npx playwright test ${failedTests.join(' ')} --reporter=list,html`;
    
    console.log(`Executando: ${cmd}`);
    execSync(cmd, { stdio: 'inherit' });

  } catch (error) {
    console.error('❌ Erro ao processar resultados:', error.message);
    process.exit(1);
  }
}

syncAndRun();
