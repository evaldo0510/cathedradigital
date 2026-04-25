import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚀 Iniciando geração do relatório de testes...');

try {
  // Execute tests with JSON reporter and capture stdout for STATS logs
  const testOutput = execSync('npx vitest run --reporter=json --reporter=verbose', { encoding: 'utf-8', stdio: 'pipe' });
  
  // Try to find the JSON file (Vitest usually prints where it saved it or we can specify)
  // Since we used --reporter=json without --outputFile in the execSync (to avoid complexity), 
  // let's just run it twice or use a temporary file.
  
  execSync('npx vitest run --reporter=json --outputFile=test-results.json', { stdio: 'inherit' });
  const results = JSON.parse(fs.readFileSync('test-results.json', 'utf-8'));

  const report = {
    totalTests: results.numTotalTests,
    passed: results.numPassedTests,
    failed: results.numFailedTests,
    scenarios: [] as any[]
  };

  // Parse stdout for STATS and specific scenarios
  const lines = testOutput.split('\n');
  let currentTest = '';
  
  lines.forEach(line => {
    if (line.includes('✓')) {
      currentTest = line.replace('✓', '').trim();
    }
    if (line.includes('STATS:')) {
      const stats = JSON.parse(line.split('STATS:')[1]);
      report.scenarios.push({
        test: currentTest,
        calls: stats,
        status: 'passed'
      });
    }
  });

  // Identify race conditions and try-again scenarios
  const raceScenarios = results.testResults.flatMap((file: any) => 
    file.assertionResults.filter((test: any) => 
      test.title.toLowerCase().includes('race') || 
      test.title.toLowerCase().includes('switch') ||
      test.title.toLowerCase().includes('retry') ||
      test.title.toLowerCase().includes('again')
    ).map((test: any) => ({
      title: test.title,
      status: test.status,
      failureMessages: test.failureMessages
    }))
  );

  console.log('\n==================================================');
  console.log('📊 RELATÓRIO DE INTEGRAÇÃO - TEMA DETAIL PAGE');
  console.log('==================================================');
  console.log(`Total de Testes: ${report.totalTests}`);
  console.log(`Sucessos: ${report.passed}`);
  console.log(`Falhas: ${report.failed}`);
  
  console.log('\n🏎️ Cenários de Corrida & Switch Rápido:');
  raceScenarios.forEach((s: any) => {
    const statusIcon = s.status === 'passed' ? '✅' : '❌';
    console.log(`${statusIcon} ${s.title}`);
  });

  console.log('\n🔄 Cenários de Retry (Tentar Novamente):');
  const retryScenarios = raceScenarios.filter((s: any) => s.title.toLowerCase().includes('retry') || s.title.toLowerCase().includes('again'));
  retryScenarios.forEach((s: any) => {
    const statusIcon = s.status === 'passed' ? '✅' : '❌';
    console.log(`${statusIcon} ${s.title}`);
  });

  console.log('\n📞 Chamadas por Aba (Amostragem):');
  report.scenarios.slice(0, 5).forEach((s: any) => {
    console.log(`- ${s.test}: ${JSON.stringify(s.calls)}`);
  });

  if (report.failed > 0) {
    console.log('\n🚨 ALERTAS DE FALHA:');
    results.testResults.forEach((file: any) => {
      file.assertionResults.forEach((test: any) => {
        if (test.status === 'failed') {
          console.log(`❌ [${file.name}] ${test.title}`);
          console.log(`   Erro: ${test.failureMessages[0]?.split('\n')[0]}`);
        }
      });
    });
  }

  console.log('==================================================\n');

} catch (error: any) {
  console.error('❌ Erro ao gerar relatório:', error.message);
  process.exit(1);
}
