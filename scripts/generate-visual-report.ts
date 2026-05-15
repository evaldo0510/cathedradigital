import fs from 'fs';
import path from 'path';

const resultsDir = path.join(process.cwd(), 'test-results');
const focusProofDir = path.join(resultsDir, 'focus-proof');
const reportFile = path.join(resultsDir, 'index.html');

function walkDir(dir: string, callback: (filePath: string) => void) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function generateGallery() {
  console.log('🚀 Gerando galeria de auditoria visual premium...');
  
  if (!fs.existsSync(focusProofDir)) {
    fs.mkdirSync(focusProofDir, { recursive: true });
  }

  const pngFiles = fs.readdirSync(focusProofDir).filter(f => f.endsWith('.png'));
  const htmlSnapshots = fs.readdirSync(focusProofDir).filter(f => f.endsWith('.html'));
  
  // Group by theme and auth state using the new __ separator
  const groups: Record<string, string[]> = {};
  pngFiles.forEach(file => {
    const parts = file.split('__');
    if (parts.length < 3) return;
    
    const theme = parts[0];
    const auth = parts[1];
    const key = `${theme} | ${auth}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(file);
  });

  const html = `
<!DOCTYPE html>
<html lang="pt-br" class="dark">
<head>
    <meta charset="UTF-8">
    <title>Cathedra | Galeria de Foco e Acessibilidade</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background: #0a0a0a; color: #eee; font-family: system-ui, sans-serif; }
        .card { background: #141414; border: 1px solid #222; border-radius: 12px; overflow: hidden; }
        .img-zoom { transition: transform 0.3s ease; }
        .img-zoom:hover { transform: scale(1.02); }
        .btn-premium { @apply px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all inline-flex items-center justify-center; }
        .btn-trace { @apply bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20; }
        .btn-html { @apply bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20; }
        .btn-viewer { @apply bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20; }
    </style>
</head>
<body class="p-8">
    <div class="max-w-7xl mx-auto space-y-16">
        <header class="flex justify-between items-end">
            <div>
                <h1 class="text-4xl font-black tracking-tighter">Galeria de Auditoria de Foco</h1>
                <p class="opacity-40 uppercase text-[10px] font-bold tracking-[0.4em] mt-3">Relatório Premium de Acessibilidade & Navegação</p>
            </div>
            <div class="text-right opacity-30 text-[10px] font-bold uppercase tracking-widest">
                Gerado em ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}
            </div>
        </header>

        ${Object.entries(groups).length === 0 ? `
            <div class="p-20 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-20">
                Nenhuma captura encontrada nesta execução.
            </div>
        ` : ''}

        ${Object.entries(groups).map(([group, images]) => `
            <section class="space-y-8">
                <div class="flex items-center gap-6">
                    <h2 class="text-sm font-black uppercase tracking-[0.5em] text-blue-500/60 whitespace-nowrap">${group}</h2>
                    <div class="h-px flex-1 bg-white/5"></div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    ${images.map(img => {
                      const parts = img.split('__');
                      const targetName = parts[2];
                      const keyName = parts[3];
                      const type = parts[4].replace('.png', '').replace('-', ' ');
                      
                      const fileNameBase = img.split('__').slice(0, 4).join('__');
                      const snapshot = htmlSnapshots.find(h => h.startsWith(fileNameBase));
                      
                      // In Playwright, traces are usually in subfolders of test-results
                      // We can't know the exact zip filename easily without more logic,
                      // but we can look for it if it exists.
                      return `
                        <div class="card p-5 space-y-4 border border-white/5 hover:border-white/10 transition-colors">
                            <div class="flex justify-between items-start">
                                <div>
                                    <p class="text-[10px] font-black uppercase tracking-widest text-white/30">${targetName} (${keyName})</p>
                                    <h3 class="text-xs font-bold mt-1 text-white/80">${type}</h3>
                                </div>
                                <span class="px-2 py-0.5 rounded bg-white/5 text-[8px] font-bold opacity-30 uppercase">${img.includes('fallback') ? 'Fallback' : 'Precise'}</span>
                            </div>
                            
                            <div class="aspect-video bg-black/40 rounded-xl overflow-hidden border border-white/5 group relative">
                                <img src="focus-proof/${img}" class="w-full h-full object-contain img-zoom" alt="${img}">
                                <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <a href="focus-proof/${img}" target="_blank" class="px-4 py-2 bg-white text-black text-[9px] font-bold rounded-full uppercase tracking-widest">Ver Fullscreen</a>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-2 pt-2">
                                ${snapshot ? `<a href="focus-proof/${snapshot}" target="_blank" class="btn-premium btn-html text-center">Contexto HTML</a>` : ''}
                                <a href="https://trace.playwright.dev/" target="_blank" class="btn-premium btn-viewer text-center">Trace Viewer</a>
                                <a href="trace.zip" class="btn-premium btn-trace text-center col-span-2">Download Trace.zip</a>
                            </div>
                        </div>
                      `;
                    }).join('')}
                </div>
            </section>
        `).join('')}
        
        <footer class="pt-20 border-t border-white/5 text-center">
            <div class="flex flex-col items-center gap-4">
                <div class="text-[10px] font-bold uppercase tracking-[0.3em] opacity-20">Cathedra Digital Audit Engine</div>
                <div class="flex gap-8 opacity-40">
                    <a href="#" class="text-[9px] hover:text-blue-400 transition-colors uppercase font-bold tracking-widest">Documentação</a>
                    <a href="#" class="text-[9px] hover:text-blue-400 transition-colors uppercase font-bold tracking-widest">Segurança</a>
                    <a href="#" class="text-[9px] hover:text-blue-400 transition-colors uppercase font-bold tracking-widest">Logs</a>
                </div>
            </div>
        </footer>
    </div>
</body>
</html>
  `;

  fs.writeFileSync(reportFile, html);
  console.log(`✅ Galeria gerada com sucesso em: ${reportFile}`);
}

generateGallery();
