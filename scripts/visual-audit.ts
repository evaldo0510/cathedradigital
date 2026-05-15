import fs from 'fs';
import path from 'path';

const standards = {
  shadows: ['shadow-premium', 'shadow-none'],
  rounded: ['rounded-premium', 'rounded-full', 'rounded-none'],
  components: ['CathedraCard', 'CathedraButton'],
};

const patterns = [
  { name: 'Sombra não padrão', regex: /shadow-(sm|md|lg|xl|2xl|inner|outline)/g },
  { name: 'Borda não padrão', regex: /rounded-(sm|md|lg|xl|2xl|3xl)/g },
  { name: 'Card não padronizado', regex: /<Card(?!.*CathedraCard)/g },
  { name: 'Botão não padronizado', regex: /<Button(?!.*CathedraButton)/g },
  { name: 'Padding irregular', regex: /p-[0-9](?!.*p-premium)/g }, 
];

interface Violation {
  file: string;
  line: number;
  pattern: string;
  match: string;
}

const getFiles = (dir: string): string[] => {
  if (!fs.existsSync(dir)) return [];
  const subdirs = fs.readdirSync(dir);
  const files = subdirs.map((subdir) => {
    const res = path.resolve(dir, subdir);
    return fs.statSync(res).isDirectory() ? getFiles(res) : res;
  });
  return Array.prototype.concat(...files);
};

const audit = () => {
  const violations: Violation[] = [];
  
  const baseFiles = [
    'src/pages/Index.tsx',
    'src/components/cathedra/HojePage.tsx',
    'src/components/cathedra/SpiritualJournalPage.tsx',
    'src/pages/CatechismExplorer.tsx',
  ];
  
  const landingFiles = getFiles('src/pages/landing');
  
  const filesToScan = [...baseFiles, ...landingFiles].map(f => path.relative(process.cwd(), f));

  filesToScan.forEach(file => {
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) return;
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      patterns.forEach(p => {
        const matches = line.match(p.regex);
        if (matches) {
          matches.forEach(m => {
            violations.push({
              file,
              line: index + 1,
              pattern: p.name,
              match: m,
            });
          });
        }
      });
    });
  });

  const report = {
    timestamp: new Date().toISOString(),
    total_violations: violations.length,
    violations_by_file: violations.reduce((acc: any, v) => {
      acc[v.file] = acc[v.file] || [];
      acc[v.file].push(v);
      return acc;
    }, {}),
    status: violations.length === 0 ? 'conforme' : 'pendente',
  };

  fs.writeFileSync('visual-audit-report.json', JSON.stringify(report, null, 2));
  console.log(`Auditoria completa. ${violations.length} violações encontradas.`);
};

audit();
