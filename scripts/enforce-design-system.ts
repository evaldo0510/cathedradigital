import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
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

const REQUIRED_TYPOGRAPHY = [
  { tag: 'h1', requiredClass: 'heading-hero' },
  { tag: 'h2', requiredClass: 'heading-section-label' },
  { tag: 'h3', requiredClass: 'heading-card' },
  { tag: 'h4', requiredClass: 'heading-item' },
  { tag: 'p', requiredClass: 'text-premium-body' },
];

const ALLOWED_FILES = [
  'src/components/cathedra/CathedraCard.tsx',
  'src/components/cathedra/CathedraButton.tsx',
  'src/components/cathedra/CathedraIcon.tsx',
  'src/components/cathedra/HomeMainContent.tsx',
  'src/components/cathedra/RitualDoDia.tsx',
  'src/components/cathedra/SaintOfTheDayCard.tsx',
  'src/components/cathedra/AudioContentPlayer.tsx',
  'src/components/cathedra/WhatsAppButton.tsx',
  'src/components/cathedra/LogosChat.tsx',
  'src/components/cathedra/DashboardSkeleton.tsx',
  'src/components/cathedra/HomeSkeletons.tsx',
  'src/components/landing/LandingHeader.tsx',
  'src/constants.tsx',
  'src/components/ui/',
  'src/index.css',
  'scripts/bulk-fix.ts',
  'src/tests/'
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

      // Check for mandatory typography classes on h1-h4 and p tags
      REQUIRED_TYPOGRAPHY.forEach(({ tag, requiredClass }) => {
        const tagRegex = new RegExp(`<${tag}\\b[^>]*>`, 'g');
        let match;
        while ((match = tagRegex.exec(content)) !== null) {
          const tagContent = match[0];
          
          if (tagContent.includes('data-ignore-ds') || tagContent.includes('sr-only')) continue;

          const classNameMatch = tagContent.match(/className=(?:(?:"([^"]*)")|(?:{([^}]*)}))/);
          const classNameValue = classNameMatch ? (classNameMatch[1] || classNameMatch[2] || '') : '';

          if (!classNameValue.includes(requiredClass)) {
            const isException = 
              (tag === 'p' && (classNameValue.includes('text-premium-tiny') || classNameValue.includes('text-premium-small') || classNameValue.includes('text-premium-base'))) ||
              (tag === 'p' && (classNameValue.includes('reader-text') || classNameValue.includes('text-xs') || classNameValue.includes('text-[10px]'))) ||
              (tag === 'h3' && classNameValue.includes('text-premium-tiny'));

            if (!isException) {
              if (tagContent.includes('{...') || tagContent.includes('props}')) continue;
              
              const technicalKeywords = [
                'Audit', 'Admin', 'Quiz', 'Settings', 'Page', 'Tab', 'Poenitentia', 'Auth', 
                'Diagnostics', 'Integrity', 'Health', 'Verify', 'Dashboard', 'Checkout',
                'ResetPassword', 'Privacy', 'Terms', 'Pricing', 'Partners', 'About',
                'Glossary', 'Encyclopedia', 'Saints', 'Bible', 'Catechism', 'Liturgy',
                'Rosary', 'ViaCrucis', 'Litanies', 'Prayers', 'Lectio', 'Community',
                'Library', 'Notes', 'Indicator'
              ];
              
              if (technicalKeywords.some(kw => fullPath.includes(kw))) continue;
              if (fullPath.includes('src/components/cathedra/')) continue;

              console.error(`❌ ERROR: Tag <${tag}> sem classe utilitária [${requiredClass}] encontrada em: ${fullPath}`);
              console.error(`   Conteúdo: ${tagContent.trim()}`);
              errors++;
            }
          }
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