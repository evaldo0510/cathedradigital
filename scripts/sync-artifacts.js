import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

/**
 * Script para baixar e sincronizar artefatos do CI localmente.
 * Requer o arquivo playwright-report/evidence-manifest.json presente.
 */
async function syncArtifacts() {
  const manifestPath = 'playwright-report/evidence-manifest.json';
  
  if (!fs.existsSync(manifestPath)) {
    console.error('❌ Manifesto não encontrado em playwright-report/evidence-manifest.json');
    console.log('Certifique-se de baixar e extrair o artefato "playwright-report" do CI.');
    process.exit(1);
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const failedTests = manifest.filter(t => t.status === 'failed' || t.status === 'unexpected');
    
    if (failedTests.length === 0) {
      console.log('✅ Nenhum teste falho para sincronizar.');
      return;
    }

    console.log(`📦 Sincronizando evidências para ${failedTests.length} falhas...`);
    
    // Agrupa falhas por device para log claro
    const devices = [...new Set(failedTests.map(t => t.project))];
    console.log(`Dispositivos afetados: ${devices.join(', ')}`);

    // Comando para rodar apenas as falhas
    const specPaths = [...new Set(failedTests.map(t => `${t.file}:${t.line}`))];
    const projectsArg = devices.map(p => `--project=${p}`).join(' ');
    
    console.log('\n🚀 Comando para replicar falhas localmente:');
    console.log(`HEADLESS=true CI=true VITE_SWIPE_THRESHOLD=80 VITE_SWIPE_RATIO=2.5 npx playwright test ${specPaths.join(' ')} ${projectsArg} --reporter=list,html`);

  } catch (error) {
    console.error('❌ Erro na sincronização:', error.message);
  }
}

syncArtifacts();
