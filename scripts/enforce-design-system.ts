import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const FORBIDDEN_COMPONENTS = [
  '@/components/ui/card',
  '@/components/ui/button',
  'lucide-react' // Should use Icons from constants
];

const ALLOWED_FILES = [
  'src/components/cathedra/CathedraCard.tsx',
  'src/components/cathedra/CathedraButton.tsx',
  'src/components/cathedra/CathedraIcon.tsx',
  'src/constants.tsx',
  'src/components/cathedra/DashboardSkeleton.tsx',
  'src/components/ui/card.tsx', // Component definition itself is allowed
  'src/components/ui/button.tsx',
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
      if (ALLOWED_FILES.some(allowed => fullPath.endsWith(allowed))) continue;

      const content = readFileSync(fullPath, 'utf-8');
      
      FORBIDDEN_COMPONENTS.forEach(forbidden => {
        if (content.includes(forbidden)) {
          console.error(`ERROR: Forbidden import "${forbidden}" found in ${fullPath}`);
          console.error(`Please use CathedraCard, CathedraButton, or Icons from constants instead.`);
          errors++;
        }
      });
    }
  }

  return errors;
}

console.log('--- Starting Design System Enforcement Scan ---');
const totalErrors = scanDir('src');

if (totalErrors > 0) {
  console.error(`\nFound ${totalErrors} design system violations.`);
  process.exit(1);
} else {
  console.log('\nDesign system enforcement check passed!');
  process.exit(0);
}
