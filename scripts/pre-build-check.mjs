import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', 'public'];
const AMBIGUOUS_PATTERNS = [
  { pattern: /data-\[state=open\]:ease-\[.*?\]/g, message: 'Ambiguidade detectada: ease dentro de data-state. Use properties CSS diretas [transition-timing-function:...]' },
  { pattern: /ease-\[.*?\]/g, message: 'Warning: Uso de ease arbitrários detectado. Verifique se não causa conflito com estados de dados.' }
];

function scanFiles(dir) {
  const files = readdirSync(dir);
  let issues = [];

  for (const file of files) {
    if (IGNORE_DIRS.includes(file)) continue;
    const path = join(dir, file);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      issues = issues.concat(scanFiles(path));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
      const content = readFileSync(path, 'utf-8');
      AMBIGUOUS_PATTERNS.forEach(ap => {
        const matches = content.match(ap.pattern);
        if (matches) {
          matches.forEach(m => {
            issues.push({ file: path, match: m, message: ap.message });
          });
        }
      });
    }
  }
  return issues;
}

const issues = scanFiles(resolve('src'));
if (issues.length > 0) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Falha na checagem pré-build: Classes Tailwind ambíguas encontradas!');
  issues.forEach(i => {
    console.error(`  - ${i.file}: ${i.match} -> ${i.message}`);
  });
  process.exit(1);
} else {
  console.log('✅ Nenhuma classe Tailwind ambígua detectada.');
}
