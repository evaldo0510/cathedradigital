import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const FORBIDDEN_COMPONENTS = [
  '@/components/ui/card',
  '@/components/ui/button',
];

// Patterns that indicate standard DS components or base configuration
const ALLOWED_FILES = [
  'src/components/cathedra/CathedraCard.tsx',
  'src/components/cathedra/CathedraButton.tsx',
  'src/components/cathedra/CathedraIcon.tsx',
  'src/components/cathedra/Button.tsx',
  'src/constants.tsx',
  'src/components/ui/',
  'src/index.css',
  'scripts/',
  'src/tests/'
];

const REQUIRED_TYPOGRAPHY = [
  { tag: 'h1', requiredClass: 'heading-hero' },
  { tag: 'h2', requiredClass: 'heading-section-label' },
  { tag: 'h3', requiredClass: 'heading-card' },
  { tag: 'h4', requiredClass: 'heading-item' },
  { tag: 'p', requiredClass: 'text-premium-body' },
];

const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'public'];

function scanDir(dir: string): number {
  const files = readdirSync(dir);
  let errors = 0;

  for (const file of files) {
    const fullPath = join(dir, file).replace(/\\/g, '/');
    if (IGNORE_DIRS.includes(file)) continue;

    if (statSync(fullPath).isDirectory()) {
      errors += scanDir(fullPath);
    } else if (['.tsx', '.ts'].includes(extname(file))) {
      // Skip files that are part of the design system infrastructure or allowed exceptions
      if (ALLOWED_FILES.some(allowed => fullPath.includes(allowed))) continue;

      const content = readFileSync(fullPath, 'utf-8');
      
      // 1. Check for forbidden UI components (must use Cathedra versions)
      FORBIDDEN_COMPONENTS.forEach(forbidden => {
        if (content.includes(forbidden)) {
          console.error(`❌ ERROR: Forbidden import "${forbidden}" found in ${fullPath}`);
          console.error(`   Use components from "@/components/cathedra/" instead.`);
          errors++;
        }
      });

      // 2. Check for mandatory typography classes on tags
      REQUIRED_TYPOGRAPHY.forEach(({ tag, requiredClass }) => {
        const tagRegex = new RegExp(`<${tag}\\b[^>]*>`, 'g');
        let match;
        while ((match = tagRegex.exec(content)) !== null) {
          const tagContent = match[0];
          
          // Skip conditions: data-ignore-ds, sr-only, self-closing (if p/h), or complex spread
          if (tagContent.includes('data-ignore-ds') || tagContent.includes('sr-only') || tagContent.endsWith('/>')) continue;
          if (tagContent.includes('{...') || tagContent.includes('props}')) continue;

          const classNameMatch = tagContent.match(/className=(?:(?:"([^"]*)")|(?:{([^}]*)}))/);
          const classNameValue = classNameMatch ? (classNameMatch[1] || classNameMatch[2] || '') : '';

          if (!classNameValue.includes(requiredClass)) {
            // Check for legitimate DS exceptions (tiny/small variants or reader mode)
            const isException = 
              (tag === 'p' && (classNameValue.includes('text-premium-tiny') || classNameValue.includes('text-premium-small') || classNameValue.includes('text-premium-base') || classNameValue.includes('reader-text'))) ||
              (tag === 'h3' && classNameValue.includes('text-premium-tiny'));

            if (!isException) {
              console.error(`❌ ERROR: Tag <${tag}> missing DS class [${requiredClass}] in: ${fullPath}`);
              console.error(`   Content: ${tagContent.trim()}`);
              errors++;
            }
          }
        }
      });
    }
  }

  return errors;
}

console.log('🔍 Running Design System Compliance Scan...');
const totalErrors = scanDir('src');

if (totalErrors > 0) {
  console.error(`\n🛑 Found ${totalErrors} design system violations.`);
  console.error('Compliance check failed. Please use standard DS classes or components.');
  process.exit(1);
} else {
  console.log('\n✨ All components are DS compliant!');
  process.exit(0);
}
