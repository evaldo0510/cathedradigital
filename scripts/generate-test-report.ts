import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚀 Iniciando geração do relatório de testes (TemaDetailPage)...');

const TEST_FILE_PATTERN = 'src/components/cathedra/TemaDetailPage';

try {
  // 1. Execute tests and generate JSON output
  console.log('  - Executando testes e coletando métricas...');
  try {
    execSync(`npx vitest run ${TEST_FILE_PATTERN} --reporter=json --outputFile=test-results.json`, { stdio: 'pipe' });
  } catch (e: any) {
    // Vitest returns non-zero if tests fail, but we still want the JSON
    if (!fs.existsSync('test-results.json')) {
      throw e;
    }
  }

  // 2. Execute tests again to capture STATS from stdout
  const stdout = execSync(`npx vitest run ${TEST_FILE_PATTERN} --reporter=verbose`, { encoding: 'utf-8', stdio: 'pipe' });

  const results = JSON.parse(fs.readFileSync('test-results.json', 'utf-8'));

  const report = {
    totalTests: results.numTotalTests,
    passed: results.numPassedTests,
    failed: results.numFailedTests,
    scenarios: [] as any[]
  };

  // Parse stdout for STATS
  const lines = stdout.split('\n');
  let currentTest = '';
  
  lines.forEach(line => {
    // Look for test names in verbose output
    if (line.includes('✓') || line.includes('×')) {
      currentTest = line.replace(/[✓×]/, '').trim();
    }
    if (line.includes('STATS:')) {
      try {
        const stats = JSON.parse(line.split('STATS:')[1]);
        report.scenarios.push({
          test: currentTest,
          calls: stats
        });
      } catch (e) {}
    }
  });

  console.log('\n==================================================');
  console.log('📊 RELATÓRIO DE INTEGRAÇÃO - TEMA DETAIL PAGE');
  console.log('==================================================');
  console.log(`Total de Testes: ${report.totalTests}`);
  console.log(`Sucessos: ${report.passed}`);
  console.log(`Falhas: ${report.failed}`);
  
  // Scenarios of interest
  const assertions = results.testResults.flatMap((file: any) => file.assertionResults);
  
  console.log('\n🏎️ Cenários de Corrida & Performance:');
  assertions.filter((t: any) => t.title.match(/race|switch|rapid/i)).forEach((t: any) => {
    console.log(`${t.status === 'passed' ? '✅' : '❌'} ${t.title}`);
  });

  console.log('\n🔄 Fluxos de Recuperação (Retry):');
  assertions.filter((t: any) => t.title.match(/retry|again|error/i)).forEach((t: any) => {
    console.log(`${t.status === 'passed' ? '✅' : '❌'} ${t.title}`);
  });

  console.log('\n⌨️ Acessibilidade & Teclado:');
  assertions.filter((t: any) => t.title.match(/keyboard|arrow/i)).forEach((t: any) => {
    console.log(`${t.status === 'passed' ? '✅' : '❌'} ${t.title}`);
  });

  console.log('\n📞 Registro de Chamadas por Teste:');
  report.scenarios.forEach((s: any) => {
    console.log(`- ${s.test}: ${s.calls.bible} chamadas detectadas`);
  });

  console.log('==================================================\n');

} catch (error: any) {
  console.error('❌ Erro crítico ao gerar relatório:', error.message);
  process.exit(1);
}
