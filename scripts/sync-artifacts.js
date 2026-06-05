import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

/**
 * Script para baixar, organizar e validar artefatos do CI localmente.
 * 
 * Uso:
 * npm run test:e2e:sync-artifacts [-- --device=mobile-chrome] [-- --test="precision"] [-- --run-id=12345]
 */
async function syncArtifacts() {
  const args = process.argv.slice(2);
  const deviceFilter = args.find(a => a.startsWith('--device='))?.split('=')[1];
  const testFilter = args.find(a => a.startsWith('--test='))?.split('=')[1];
  const runId = args.find(a => a.startsWith('--run-id='))?.split('=')[1];

  const manifestPath = 'playwright-report/evidence-manifest.json';

  // Tenta baixar se runId for fornecido e gh estiver disponível
  if (runId) {
    try {
      console.log(`Attempting to download artifacts for run ${runId}...`);
      execSync(`gh run download ${runId} -n playwright-report-${runId} -D playwright-report`, { stdio: 'inherit' });
    } catch (e) {
      console.warn('⚠️ Could not download via "gh" CLI. Ensure gh is installed and you are logged in.');
    }
  }

  if (!fs.existsSync(manifestPath)) {
    console.error('❌ Manifesto não encontrado em playwright-report/evidence-manifest.json');
    console.log('Certifique-se de baixar o artefato do CI ou fornecer --run-id se tiver o GitHub CLI instalado.');
    process.exit(1);
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    let targets = manifest;

    // Filtros
    if (deviceFilter) {
      targets = targets.filter(t => t.project === deviceFilter);
      console.log(`🔍 Filtrando por dispositivo: ${deviceFilter}`);
    }
    if (testFilter) {
      targets = targets.filter(t => t.title.toLowerCase().includes(testFilter.toLowerCase()));
      console.log(`🔍 Filtrando por termo no teste: ${testFilter}`);
    }

    const failedTests = targets.filter(t => t.status === 'failed' || t.status === 'unexpected');
    
    if (failedTests.length === 0) {
      console.log('✅ Nenhum teste falho encontrado no manifesto (com os filtros atuais).');
      return;
    }

    console.log(`📦 Validando evidências para ${failedTests.length} falhas...`);
    
    let missingFiles = [];
    failedTests.forEach(test => {
      const { evidences } = test;
      ['trace', 'screenshot', 'video'].forEach(type => {
        const relPath = evidences[type];
        if (relPath) {
          const fullPath = path.join('playwright-report', relPath);
          if (!fs.existsSync(fullPath)) {
            missingFiles.push(`[${test.project}] ${test.title} -> Missing ${type}: ${fullPath}`);
          }
        }
      });
    });

    if (missingFiles.length > 0) {
      console.error('\n❌ Validação Pós-Sync Falhou! Arquivos ausentes:');
      missingFiles.forEach(m => console.error(`  - ${m}`));
      process.exit(1);
    }

    console.log('✅ Todas as evidências (Trace, Screenshot, Video) foram validadas localmente.');

    // Exibe comando de réplica
    const specPaths = [...new Set(failedTests.map(t => `${t.file}:${t.line}`))];
    const projectsArg = [...new Set(failedTests.map(t => t.project))].map(p => `--project=${p}`).join(' ');
    
    console.log('\n🚀 Comando para replicar EXATAMENTE essas falhas localmente:');
    console.log(`HEADLESS=true CI=true VITE_SWIPE_THRESHOLD=80 VITE_SWIPE_RATIO=2.5 npx playwright test ${specPaths.join(' ')} ${projectsArg} --reporter=list,html`);

  } catch (error) {
    console.error('❌ Erro na sincronização:', error.message);
  }
}

syncArtifacts();
