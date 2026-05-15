import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const LEGACY_CLASSES = [
  'rounded-2xl',
  'rounded-3xl',
  'shadow-md',
  'shadow-xl',
  'shadow-2xl',
  'bg-white/5',
  'bg-white/4',
  'border-white/5',
  'border-white/10',
];

const TYPOGRAPHY_CLASSES = [
  'heading-hero',
  'heading-section-label',
  'heading-card',
  'heading-item',
  'text-premium-body',
];

const TARGET_DIRS = ['src/components', 'src/pages'];
const EXCLUDE_FILES = ['index.css', 'generate-visual-report.ts', 'design-system-audit.ts'];

console.log('🔍 Iniciando Auditoria do Design System...');

let fail = false;

function auditFiles(dir: string) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      auditFiles(fullPath);
      continue;
    }

    if (!file.endsWith('.tsx') && !file.endsWith('.ts')) continue;
    if (EXCLUDE_FILES.includes(file)) continue;

    const content = fs.readFileSync(fullPath, 'utf-8');
    
    // Check for legacy classes with word boundaries
    for (const legacy of LEGACY_CLASSES) {
      const regex = new RegExp(`\\b${legacy.replace(/\//g, '\\/')}\\b`);
      if (regex.test(content)) {
        console.error(`❌ Legacy Class [${legacy}] encontrada em: ${fullPath}`);
        fail = true;
      }
    }

    // Check for non-standard typography in components that aren't base UI
    // Note: This is a loose check as some elements might intentionally be unique
    const hasRawHeadingTags = /<(h1|h2|h3|h4|p)([^>]*?)>/.test(content);
    const usesUtilityClass = TYPOGRAPHY_CLASSES.some(cls => content.includes(cls));
    
    // We only warn if it has raw tags but NO utility classes at all in the file (heuristic)
    if (hasRawHeadingTags && !usesUtilityClass && !fullPath.includes('src/components/ui/')) {
        // console.warn(`⚠️ Possível falta de utilitárias de tipografia em: ${fullPath}`);
    }
  }
}

TARGET_DIRS.forEach(dir => auditFiles(dir));

if (fail) {
  console.log('\n🛑 Auditoria falhou. Por favor, corrija as classes legadas.');
  process.exit(1);
} else {
  console.log('\n✅ Design System em conformidade!');
  process.exit(0);
}
