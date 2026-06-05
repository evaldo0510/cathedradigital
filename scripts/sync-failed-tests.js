import fs from 'fs';
import { execSync } from 'child_process';

/**
 * Script para sincronizar e rodar apenas os testes que falharam no CI usando o evidence-manifest.json.
 */
function syncAndRun() {
  const manifestPath = 'playwright-report/evidence-manifest.json';
  
  if (!fs.existsSync(manifestPath)) {
    console.error('❌ Arquivo playwright-report/evidence-manifest.json não encontrado.');
    console.log('Baixe os artefatos da execução do CI e extraia o conteúdo de playwright-report/ na raiz.');
    process.exit(1);
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const failedTests = [];
    const projects = new Set();

    manifest.forEach(item => {
      if (item.status === 'failed' || item.status === 'unexpected') {
        failedTests.push(`${item.file}:${item.line}`);
        projects.add(item.project);
      }
    });

    if (failedTests.length === 0) {
      console.log('✅ Nenhum teste falho encontrado no manifesto.');
      return;
    }

    console.log(`🚀 Sincronizando e reexecutando ${failedTests.length} testes falhos...`);
    
    const projectsArg = Array.from(projects).map(p => `--project=${p}`).join(' ');
    const cmd = `HEADLESS=true CI=true VITE_SWIPE_THRESHOLD=80 VITE_SWIPE_RATIO=2.5 npx playwright test ${failedTests.join(' ')} ${projectsArg} --reporter=list,html`;
    
    console.log(`Executando: ${cmd}`);
    execSync(cmd, { stdio: 'inherit' });

  } catch (error) {
    console.error('❌ Erro ao processar manifesto:', error.message);
    process.exit(1);
  }
}

syncAndRun();
