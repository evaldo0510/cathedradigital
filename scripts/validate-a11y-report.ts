import fs from 'fs';
import path from 'path';

const reportPath = path.join(process.cwd(), 'public', 'a11y-reports', 'index.html');
const reportDir = path.dirname(reportPath);

async function validate() {
  console.log('🔍 Validando referências do relatório de acessibilidade...');

  if (!fs.existsSync(reportPath)) {
    console.warn('⚠️ Relatório de acessibilidade não encontrado em public/a11y-reports/index.html');
    return;
  }

  const htmlContent = fs.readFileSync(reportPath, 'utf-8');
  const imgTags = htmlContent.match(/<img[^>]+src="([^">]+)"/g) || [];
  
  const missingFiles: string[] = [];
  
  imgTags.forEach(tag => {
    const srcMatch = tag.match(/src="([^">]+)"/);
    if (srcMatch && srcMatch[1]) {
      const src = srcMatch[1];
      // Skip external images if any
      if (src.startsWith('http') || src.startsWith('//')) return;
      
      const filePath = path.join(reportDir, src);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(src);
      }
    }
  });

  if (missingFiles.length > 0) {
    console.error('❌ Falha na validação do relatório: Os seguintes arquivos estão ausentes:');
    missingFiles.forEach(f => console.error(`   - ${f}`));
    process.exit(1);
  }

  console.log('✅ Todas as imagens referenciadas no relatório de acessibilidade existem!');
}

validate().catch(err => {
  console.error(err);
  process.exit(1);
});
