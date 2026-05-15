import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const FORBIDDEN_COMPONENTS = [
  '@/components/ui/card',
  '@/components/ui/button',
];

const FORBIDDEN_CLASSES = [
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

const ALLOWED_FILES = [
  'src/components/cathedra/CathedraCard.tsx',
  'src/components/cathedra/CathedraButton.tsx',
  'src/components/cathedra/CathedraIcon.tsx',
  'src/constants.tsx',
  'src/components/cathedra/DashboardSkeleton.tsx',
  'src/components/ui/card.tsx', 
  'src/components/ui/button.tsx',
  'src/index.css',
  'scripts/bulk-fix.ts'
];

const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'public'];

function scanDir(dir: string) {
  const files = readdirSync(dir);
  let errors = 0;

  for (const file of files) {
    const fullPath = join(dir, file);
    if (IGNORE_DIRS.includes(file)) continue;

    if (statSync(fullPath).isDirectory()) {
      errors += scanDir(fullPath);
    } else if (['.tsx', '.ts'].includes(extname(file))) {
      if (ALLOWED_FILES.some(allowed => fullPath.includes(allowed))) continue;

      const content = readFileSync(fullPath, 'utf-8');
      
      FORBIDDEN_COMPONENTS.forEach(forbidden => {
        if (content.includes(forbidden)) {
          console.error(`❌ ERROR: Forbidden import "${forbidden}" found in ${fullPath}`);
          errors++;
        }
      });

      FORBIDDEN_CLASSES.forEach(forbidden => {
        const regex = new RegExp(`\\b${forbidden.replace(/\//g, '\\/')}\\b`);
        if (regex.test(content)) {
          console.error(`❌ ERROR: Legacy Class [${forbidden}] encontrada em: ${fullPath}`);
          errors++;
        }
      });
    }
  }

  return errors;
}

console.log('🔍 Iniciando Scan de Conformidade do Design System...');
const totalErrors = scanDir('src');

if (totalErrors > 0) {
  console.error(`\n🛑 Foram encontrados ${totalErrors} violações no design system.`);
  process.exit(1);
} else {
  console.log('\n✨ Todos os componentes estão em conformidade!');
  process.exit(0);
}
