import fs from 'fs';
import path from 'path';

const REPLACEMENTS: Record<string, string> = {
  'rounded-2xl': 'rounded-premium-sm',
  'rounded-3xl': 'rounded-premium',
  'shadow-md': 'shadow-soft',
  'shadow-xl': 'shadow-premium',
  'shadow-2xl': 'shadow-premium',
  'bg-white/5': 'bg-white/[0.05]',
  'bg-white/4': 'bg-white/[0.04]',
  'border-white/5': 'border-white/[0.05]',
  'border-white/10': 'border-white/[0.08]',
};

const TARGET_DIRS = ['src/components', 'src/pages'];

function processFiles(dir: string) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processFiles(fullPath);
      continue;
    }

    if (!file.endsWith('.tsx') && !file.endsWith('.ts')) continue;
    if (file === 'index.css' || file === 'design-system-audit.ts' || file === 'bulk-fix.ts') continue;

    let content = fs.readFileSync(fullPath, 'utf-8');
    let changed = false;

    for (const [legacy, replacement] of Object.entries(REPLACEMENTS)) {
      if (content.includes(legacy)) {
        // Use a more careful regex to replace only class names
        const regex = new RegExp(`\\b${legacy}\\b`, 'g');
        content = content.replace(regex, replacement);
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Fixed legacy classes in: ${fullPath}`);
    }
  }
}

TARGET_DIRS.forEach(dir => processFiles(dir));
console.log('✨ Bulk fix completed!');
