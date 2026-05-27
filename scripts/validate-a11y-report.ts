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
  
  // Regex to find src in img tags and href in a tags
  const imgSources = (htmlContent.match(/<img[^>]+src="([^">]+)"/g) || []).map(tag => {
    const match = tag.match(/src="([^">]+)"/);
    return match ? match[1] : null;
  }).filter(Boolean) as string[];

  const anchorHrefs = (htmlContent.match(/<a[^>]+href="([^">]+)"/g) || []).map(tag => {
    const match = tag.match(/href="([^">]+)"/);
    return match ? match[1] : null;
  }).filter(Boolean) as string[];

  const allRefs = [...new Set([...imgSources, ...anchorHrefs])];
  const missingFiles: string[] = [];
  
  allRefs.forEach(src => {
    // Skip external links, fragments, or empty
    if (!src || src.startsWith('http') || src.startsWith('//') || src.startsWith('#') || src.startsWith('mailto:')) return;
    
    // Resolve relative path
    const filePath = path.join(reportDir, src);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(src);
    }
  });

  // Also check for specific mandatory artifacts
  const mandatoryArtifacts = ['summary.json'];
  mandatoryArtifacts.forEach(art => {
    const artPath = path.join(reportDir, art);
    if (!fs.existsSync(artPath)) {
      missingFiles.push(`Mandatory artifact missing: ${art}`);
    }
  });

  if (missingFiles.length > 0) {
    console.error('❌ Falha na validação do relatório: Os seguintes arquivos referenciados estão ausentes:');
    missingFiles.forEach(f => console.error(`   - ${f}`));
    process.exit(1);
  }

  console.log('✅ Todas as imagens, JSONs e HTMLs referenciados no relatório de acessibilidade existem!');
}

validate().catch(err => {
  console.error(err);
  process.exit(1);
});
