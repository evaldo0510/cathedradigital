import fs from 'fs';
import path from 'path';

const PAGES = [
  { name: 'Home', path: 'src/components/cathedra/HojePage.tsx' },
  { name: 'Bible', path: 'src/components/cathedra/Bible.tsx' },
  { name: 'Catechism', path: 'src/components/cathedra/Catechism.tsx' },
  { name: 'Library', path: 'src/components/cathedra/BibliotecaPage.tsx' },
  { name: 'Documents', path: 'src/components/cathedra/Magisterium.tsx' },
  { name: 'Search', path: 'src/components/cathedra/GlobalSearchPage.tsx' },
];

const THRESHOLDS = {
  total: 85,
  layout: 75,
  card: 90,
  theme: 90,
  tokens: 85
};

const LAYOUT_COMPONENTS = ['ContemplativeLayout', 'motion', 'CathedraOverlay', 'SectionHeader'];
const CARD_COMPONENTS = ['CathedraCard'];
const THEME_CLASSES = ['bg-background', 'text-foreground', 'bg-primary', 'text-primary', 'bg-secondary', 'text-secondary', 'border-border', 'bg-muted', 'text-muted-foreground'];
const SPACING_TOKENS = ['spacing-xs', 'spacing-sm', 'spacing-md', 'spacing-lg', 'spacing-xl', 'spacing-2xl', 'spacing-3xl', 'spacing-4xl'];

// Allowed Design Tokens
const ALLOWED_TOKENS = [
  ...THEME_CLASSES,
  ...SPACING_TOKENS.map(s => `p-${s}`),
  ...SPACING_TOKENS.map(s => `m-${s}`),
  ...SPACING_TOKENS.map(s => `gap-${s}`),
  'rounded-premium', 'rounded-premium-lg', 'rounded-premium-full',
  'shadow-premium', 'shadow-premium-hover', 'shadow-premium-xl',
  'text-premium-xs', 'text-premium-sm', 'text-premium-base', 'text-premium-lg', 'text-premium-xl'
];

function auditFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const violations = [];
  
  // Layout compliance
  let layoutScore = 0;
  LAYOUT_COMPONENTS.forEach(comp => {
    if (content.includes(comp)) layoutScore += 25;
  });

  // Card compliance
  let cardScore = 0;
  const hasGenericCards = /className="[^"]*rounded-(xl|2xl|3xl)[^"]*bg-(white|card)/.test(content);
  if (content.includes('CathedraCard')) cardScore = 100;
  else if (hasGenericCards) {
    cardScore = 20;
    violations.push('Uses generic card classes instead of <CathedraCard />');
  } else cardScore = 100;

  // Theme compliance
  const hardcodedColors = content.match(/#[0-9A-Fa-f]{3,6}/g) || [];
  let themeScore = Math.max(0, 100 - (hardcodedColors.length * 10));
  if (hardcodedColors.length > 0) {
    violations.push(`Found ${hardcodedColors.length} hardcoded hex colors`);
  }

  // Token compliance
  const hardcodedSpacing = content.match(/\b(p|m|gap)-[0-9]+\b/g) || [];
  let tokenScore = Math.max(0, 100 - (hardcodedSpacing.length * 5));
  if (hardcodedSpacing.length > 0) {
    violations.push(`Found ${hardcodedSpacing.length} hardcoded Tailwind spacing classes`);
  }

  return {
    layout: layoutScore,
    card: cardScore,
    theme: themeScore,
    tokens: tokenScore,
    total: (layoutScore + cardScore + themeScore + tokenScore) / 4,
    violations
  };
}

const results = PAGES.map(page => {
  const audit = auditFile(page.path);
  return audit ? { ...page, ...audit } : null;
}).filter(Boolean);

results.sort((a, b) => a.total - b.total);

let report = '# Design System Compliance Report\n\n';
report += '| Page | Layout % | Card % | Theme % | Token % | Overall % |\n';
report += '| :--- | :---: | :---: | :---: | :---: | :---: |\n';

results.forEach(r => {
  report += `| ${r.name} | ${r.layout}% | ${r.card}% | ${r.theme}% | ${r.tokens}% | **${r.total.toFixed(1)}%** |\n`;
});

report += '\n## Top 10 Violations\n\n';
const allViolations = results.flatMap(r => r.violations.map(v => ({ page: r.name, msg: v })));
const uniqueViolations = allViolations.slice(0, 10);

uniqueViolations.forEach((v, i) => {
  report += `${i + 1}. **${v.page}**: ${v.msg}\n`;
});

// History Tracking
const historyPath = 'reports/compliance-history.json';
let history = [];
if (fs.existsSync(historyPath)) {
  history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
}
const snapshot = {
  timestamp: new Date().toISOString(),
  avgTotal: results.reduce((acc, r) => acc + r.total, 0) / results.length,
  pages: results.map(r => ({ name: r.name, total: r.total }))
};
history.push(snapshot);
if (history.length > 50) history.shift();
if (!fs.existsSync('reports')) fs.mkdirSync('reports');
fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));

if (!fs.existsSync('src/components/cathedra/reports')) {
  fs.mkdirSync('src/components/cathedra/reports', { recursive: true });
}
fs.writeFileSync('src/components/cathedra/reports/COMPLIANCE_REPORT.md', report);

// CI Enforcement
const failures = results.filter(r => r.total < THRESHOLDS.total);
if (failures.length > 0) {
  console.error('❌ DESIGN SYSTEM COMPLIANCE FAILED');
  failures.forEach(f => {
    console.error(`- ${f.name}: ${f.total.toFixed(1)}% (Threshold: ${THRESHOLDS.total}%)`);
  });
  process.exit(1);
}

console.log('✅ Compliance check passed');
