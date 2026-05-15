import fs from 'fs';
import path from 'path';

const resultsDir = path.join(process.cwd(), 'test-results');
const focusProofDir = path.join(resultsDir, 'focus-proof');
const reportFile = path.join(resultsDir, 'index.html');

function generateGallery() {
  console.log('🚀 Gerando galeria de auditoria visual...');
  
  if (!fs.existsSync(focusProofDir)) {
    console.log('⚠️ Pasta focus-proof não encontrada.');
    return;
  }

  const files = fs.readdirSync(focusProofDir).filter(f => f.endsWith('.png'));
  
  // Group by theme and auth state
  const groups: Record<string, string[]> = {};
  files.forEach(file => {
    const parts = file.split('-');
    const theme = parts[0];
    const auth = `${parts[1]}-${parts[2]}`; // logged-in or logged-out
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
        .img-zoom:hover { transform: scale(1.05); }
    </style>
</head>
<body class="p-8">
    <div class="max-w-7xl mx-auto space-y-12">
        <header>
            <h1 class="text-3xl font-bold">Galeria de Auditoria de Foco</h1>
            <p class="opacity-50 uppercase text-xs tracking-widest mt-2">Relatório Premium de Navegação por Teclado</p>
        </header>

        ${Object.entries(groups).map(([group, images]) => `
            <section class="space-y-4">
                <h2 class="text-xl font-bold border-l-4 border-primary pl-4 uppercase tracking-tight text-blue-400">${group}</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    ${images.map(img => `
                        <div class="card p-4 space-y-3">
                            <p class="text-[10px] font-mono opacity-60 truncate">${img}</p>
                            <div class="aspect-video bg-black rounded-lg overflow-hidden border border-white/5">
                                <img src="focus-proof/${img}" class="w-full h-full object-contain img-zoom" alt="${img}">
                            </div>
                            <div class="flex justify-between items-center text-[10px] uppercase font-bold opacity-40">
                                <span>${img.includes('initial') ? 'Foco Inicial' : img.includes('destination') ? 'Foco Destino' : 'Foco Restaurado'}</span>
                                <span>PNG</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `).join('')}
        
        <footer class="pt-12 border-t border-white/5 text-center text-xs opacity-30">
            <p>Gerado automaticamente pelo CI do Cathedra Digital em ${new Date().toLocaleString('pt-BR')}</p>
        </footer>
    </div>
</body>
</html>
  `;

  fs.writeFileSync(reportFile, html);
  console.log(`✅ Galeria gerada em: ${reportFile}`);
}

generateGallery();
