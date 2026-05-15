import fs from 'fs';
import path from 'path';

const standards = {
  shadows: ['shadow-premium', 'shadow-none'],
  rounded: ['rounded-premium', 'rounded-full', 'rounded-none'],
  components: ['CathedraCard', 'CathedraButton'],
};

const routesToCheck = [
  { name: 'Home', path: 'src/pages/Index.tsx' },
  { name: 'Hoje', path: 'src/components/cathedra/HojePage.tsx' },
  { name: 'Diário Espiritual', path: 'src/components/cathedra/SpiritualJournalPage.tsx' },
];

const patterns = [
  { name: 'Sombra não padrão', regex: /shadow-(sm|md|lg|xl|2xl|inner|outline)/g },
  { name: 'Borda não padrão', regex: /rounded-(sm|md|lg|xl|2xl|3xl)/g },
  { name: 'Card não padronizado', regex: /<Card(?!.*CathedraCard)/g },
  { name: 'Botão não padronizado', regex: /<Button(?!.*CathedraButton)/g },
  { name: 'Padding irregular', regex: /p-[0-9](?!.*p-premium)/g }, // Very loose check
];

interface Violation {
  file: string;
  line: number;
  pattern: string;
  match: string;
}

const audit = () => {
  const violations: Violation[] = [];
  const filesToScan = [
    'src/pages/Index.tsx',
    'src/components/cathedra/HojePage.tsx',
    'src/components/cathedra/SpiritualJournalPage.tsx',
    'src/pages/CatechismExplorer.tsx',
    ...fs.readdirSync('src/pages/landing').map(f => `src/pages/landing/${f}`),
  ];

  filesToScan.forEach(file => {
    if (!fs.existsSync(file)) return;
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
