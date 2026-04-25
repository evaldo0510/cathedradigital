import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚀 Iniciando geração do relatório de testes (TemaDetailPage)...');

const TEST_FILE_PATTERN = 'src/components/cathedra/TemaDetailPage';

try {
  // 1. Execute tests and generate JSON output
  console.log('  - Executando testes e coletando métricas (isso pode levar um momento)...');
  try {
    // Run vitest and ignore non-zero exit code (failures are handled in report)
    execSync(`npx vitest run ${TEST_FILE_PATTERN} --reporter=json --outputFile=test-results.json`, { stdio: 'inherit' });
  } catch (e: any) {
    if (!fs.existsSync('test-results.json')) {
      console.error('❌ Falha ao gerar arquivo de resultados JSON.');
      process.exit(1);
    }
  }

  // 2. Read results
  const results = JSON.parse(fs.readFileSync('test-results.json', 'utf-8'));

  const report = {
    totalTests: results.numTotalTests,
    passed: results.numPassedTests,
    failed: results.numFailedTests,
  };

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

  console.log('\n📂 Arquivos de Teste Analisados:');
  results.testResults.forEach((file: any) => {
    console.log(`- ${file.name}`);
  });

  console.log('==================================================\n');

} catch (error: any) {
  console.error('❌ Erro crítico ao gerar relatório:', error.message);
  process.exit(1);
}
