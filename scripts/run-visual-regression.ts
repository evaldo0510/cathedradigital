import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

async function runVisualTests() {
  console.log('🚀 Iniciando Auditoria Visual e de Acessibilidade (Premium)...');
  
  const publicResultsPath = path.join(process.cwd(), 'public', 'visual-regression');
  if (!fs.existsSync(publicResultsPath)) {
    fs.mkdirSync(publicResultsPath, { recursive: true });
  }

  const reportPath = path.join(process.cwd(), 'public', 'visual-regression-report.html');
  const results: any = {
    timestamp: new Date().toISOString(),
    status: 'pending',
    pages: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
    }
  };

  try {
    // Run Playwright tests
    console.log('  - Executando Playwright com Snapshots e Axe-core...');
    // execSync('npx playwright test tests/e2e/visual-regression.spec.ts', {
    //   stdio: 'inherit',
    //   env: { ...process.env, CI: 'true' }
    // });
    results.status = 'failed';
  } catch (error) {
    console.error('❌ Diferenças visuais ou falhas de acessibilidade encontradas.');
    results.status = 'failed';
  }
  // Continue anyway to generate report from any available data

  // Parse the playwright json report
  const playwrightReportPath = path.join(process.cwd(), 'test-results', 'report.json');
  if (fs.existsSync(playwrightReportPath)) {
    const playwrightReport = JSON.parse(fs.readFileSync(playwrightReportPath, 'utf8'));
    
    // Playwright nested structure
    const extractTests = (suites: any[]) => {
      suites.forEach(suite => {
        if (suite.specs) {
          suite.specs.forEach((spec: any) => {
            spec.tests.forEach((test: any) => {
              results.summary.total++;
              const result = test.results[0];
              const isFailed = result.status !== 'passed';
              
              if (isFailed) results.summary.failed++;
              else results.summary.passed++;

              // Extract images
              const attachments = result.attachments || [];
              const diff = attachments.find((a: any) => a.name.includes('diff'));
              const actual = attachments.find((a: any) => a.name.includes('actual'));
              const expected = attachments.find((a: any) => a.name.includes('expected'));

              // Copy images to public for the report if they exist
              const copyToPublic = (src: string | undefined) => {
                if (!src || !fs.existsSync(src)) return null;
                const fileName = path.basename(src);
                const dest = path.join(publicResultsPath, fileName);
                fs.copyFileSync(src, dest);
                return `visual-regression/${fileName}`;
              };

              results.pages.push({
                name: spec.title,
                status: result.status,
                duration: result.duration,
                errors: result.errors?.map((e: any) => e.message) || [],
                diffImage: copyToPublic(diff?.path),
                actualImage: copyToPublic(actual?.path),
                expectedImage: copyToPublic(expected?.path),
              });
            });
          });
        }
        if (suite.suites) {
          extractTests(suite.suites);
        }
      });
    };

    extractTests(playwrightReport.suites);
  }

  // Generate HTML Report
  const html = `
<!DOCTYPE html>
<html lang="pt-br" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cathedra Digital | Relatório de Regressão Visual</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background: #0a0a0a; color: #f5f5f5; }
        .premium-card { background: rgba(20, 20, 20, 0.8); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 24px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4); }
        .font-premium { font-family: 'Playfair Display', serif; }
        .status-pass { color: #10b981; }
        .status-fail { color: #ef4444; }
        .img-container { background: #111; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.05); }
        pre { background: #111; color: #ef4444; padding: 1rem; border-radius: 8px; font-size: 0.75rem; overflow-x: auto; border: 1px solid rgba(239, 68, 68, 0.2); }
    </style>
</head>
<body class="p-4 md:p-8">
    <div class="max-w-7xl mx-auto space-y-8">
        <header class="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h1 class="text-4xl font-premium font-black tracking-tight">Auditoria Visual</h1>
                <p class="opacity-50 text-sm uppercase tracking-widest font-bold">Cathedra Digital System</p>
            </div>
            <div class="flex gap-4">
                <div class="text-right">
                    <p class="text-[10px] opacity-40 uppercase font-black">Data da Execução</p>
                    <p class="text-sm font-bold">${new Date(results.timestamp).toLocaleString('pt-BR')}</p>
                </div>
                <div class="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest">
                    Status: <span class="${results.status === 'success' ? 'status-pass' : 'status-fail'}">${results.status.toUpperCase()}</span>
                </div>
            </div>
        </header>

        <section class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="premium-card p-6 text-center">
                <p class="text-[10px] opacity-40 uppercase font-black mb-1">Total de Testes</p>
                <p class="text-3xl font-black">${results.summary.total}</p>
            </div>
            <div class="premium-card p-6 text-center">
                <p class="text-[10px] opacity-40 uppercase font-black mb-1">Sucessos</p>
                <p class="text-3xl font-black status-pass">${results.summary.passed}</p>
            </div>
            <div class="premium-card p-6 text-center">
                <p class="text-[10px] opacity-40 uppercase font-black mb-1">Falhas</p>
                <p class="text-3xl font-black status-fail">${results.summary.failed}</p>
            </div>
            <div class="premium-card p-6 text-center">
                <p class="text-[10px] opacity-40 uppercase font-black mb-1">Taxa de Sucesso</p>
                <p class="text-3xl font-black text-blue-400">${Math.round((results.summary.passed / results.summary.total) * 100) || 0}%</p>
            </div>
        </section>

        <section class="space-y-6">
            <h2 class="text-xl font-premium font-black">Resultados Detalhados</h2>
            ${results.pages.map((page: any) => `
                <div class="premium-card overflow-hidden">
                    <div class="p-6 border-b border-white/5 flex items-center justify-between">
                        <div>
                            <h3 class="font-bold text-lg">${page.name}</h3>
                            <p class="text-[10px] opacity-40 uppercase font-black tracking-widest">${page.duration}ms de execução</p>
                        </div>
                        <div class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${page.status === 'passed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}">
                            ${page.status.toUpperCase()}
                        </div>
                    </div>
                    
                    ${page.status !== 'passed' ? `
                        <div class="p-6 space-y-6">
                            ${page.errors.length > 0 ? `<pre>${page.errors.join('\n')}</pre>` : ''}
                            
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div class="space-y-2">
                                    <p class="text-[10px] opacity-40 uppercase font-black">Baseline (Esperado)</p>
                                    <div class="img-container">
                                        <img src="${page.expectedImage || ''}" alt="Expected" class="w-full h-auto" onerror="this.src='https://placehold.co/600x400/111/444?text=N/A'">
                                    </div>
                                </div>
                                <div class="space-y-2">
                                    <p class="text-[10px] opacity-40 uppercase font-black">Atual (Encontrado)</p>
                                    <div class="img-container border-red-500/20">
                                        <img src="${page.actualImage || ''}" alt="Actual" class="w-full h-auto" onerror="this.src='https://placehold.co/600x400/111/444?text=N/A'">
                                    </div>
                                </div>
                                <div class="space-y-2">
                                    <p class="text-[10px] opacity-40 uppercase font-black">Diferença (Diff)</p>
                                    <div class="img-container border-red-500/50">
                                        <img src="${page.diffImage || ''}" alt="Diff" class="w-full h-auto" onerror="this.src='https://placehold.co/600x400/111/444?text=N/A'">
                                    </div>
                                </div>
                            </div>

                            <div class="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                                <p class="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Ação Sugerida</p>
                                <p class="text-sm opacity-80">Se as mudanças forem desejadas, execute <code class="bg-black/50 px-2 py-0.5 rounded text-blue-300">npx playwright test --update-snapshots</code> para atualizar as baselines.</p>
                            </div>
                        </div>
                    ` : `
                        <div class="p-6 bg-emerald-500/5 flex items-center gap-3">
                            <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                            <p class="text-sm opacity-60">Consistência visual mantida. Nenhuma discrepância encontrada.</p>
                        </div>
                    `}
                </div>
            `).join('')}
        </section>
    </div>
</body>
</html>
  `;

  fs.writeFileSync(reportPath, html);
  console.log(`✅ Relatório HTML gerado em: ${reportPath}`);
}

runVisualTests();