import fs from 'fs';
import path from 'path';

function getFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = entries.map((entry) => {
    const res = path.resolve(dir, entry.name);
    return entry.isDirectory() ? getFiles(res) : res;
  });
  return Array.prototype.concat(...files);
}

const patterns = [
  { name: 'Sombra não padrão', regex: /shadow-(sm|md|lg|xl|2xl|inner|outline)/g },
  { name: 'Borda não padrão', regex: /rounded-(sm|md|lg|xl|2xl|3xl)/g },
  { name: 'Card não padronizado', regex: /<Card(?!.*CathedraCard)/g },
  { name: 'Botão não padronizado', regex: /<Button(?!.*CathedraButton)/g }
];

const baseFiles = [
  'src/pages/Index.tsx',
  'src/components/cathedra/HojePage.tsx',
  'src/components/cathedra/SpiritualJournalPage.tsx',
  'src/pages/CatechismExplorer.tsx',
];

const landingFiles = getFiles('src/pages/landing');
const allFiles = [...baseFiles, ...landingFiles].filter(f => fs.existsSync(f) && !fs.statSync(f).isDirectory());

const violations: any[] = [];

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    patterns.forEach(p => {
      const matches = line.match(p.regex);
      if (matches) {
        matches.forEach(m => {
          violations.push({
            file: path.relative(process.cwd(), file),
            line: i + 1,
            pattern: p.name,
            match: m
          });
        });
      }
    });
  });
});

const report = {
  timestamp: new Date().toISOString(),
  total_violations: violations.length,
  violations,
  status: violations.length === 0 ? 'conforme' : 'pendente'
};

fs.writeFileSync('visual-audit-report.json', JSON.stringify(report, null, 2));
console.log(`Auditoria completa: ${violations.length} violações.`);
