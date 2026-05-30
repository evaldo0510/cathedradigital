import fs from 'fs';
import path from 'path';

const spacingMap: Record<string, string> = {
  '0': '0',
  '0.5': '3xs',
  '1': '2xs',
  '1.5': '2xs',
  '2': 'xs',
  '2.5': 'xs',
  '3': 'sm',
  '3.5': 'sm',
  '4': 'md',
  '5': 'md',
  '6': 'lg',
  '7': 'lg',
  '8': 'xl',
  '9': 'xl',
  '10': 'xl',
  '11': 'xl',
  '12': '2xl',
  '14': '2xl',
  '16': '3xl',
  '20': '3xl',
  '24': '4xl',
  '28': '4xl',
  '32': '4xl',
  '36': '4xl',
  '40': '4xl',
  '44': '4xl',
  '48': '4xl',
  '52': '4xl',
  '56': '4xl',
  '60': '4xl',
  '64': '4xl',
  '72': '4xl',
  '80': '4xl',
  '96': '4xl',
};

const shadowMap: Record<string, string> = {
  'sm': 'sm',
  'md': 'md',
  'lg': 'premium',
  'xl': 'premium',
  '2xl': 'premium',
  'soft': 'md',
};

const radiusMap: Record<string, string> = {
  'sm': 'sm',
  'md': 'md',
  'lg': 'lg',
  'xl': 'xl',
  '2xl': 'premium',
  '3xl': 'premium',
  'premium-sm': 'sm',
  'premium-lg': 'lg',
};

const prefixes = ['p', 'm', 'w', 'h', 'gap', 'space-x', 'space-y', 'top', 'bottom', 'left', 'right', 'px', 'py', 'pt', 'pb', 'pl', 'pr', 'mx', 'my', 'mt', 'mb', 'ml', 'mr', 'inset', 'size'];

function migrateFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Spacing migration
  prefixes.forEach(prefix => {
    // Negative lookbehind for letters to avoid pt-BR etc.
    const regex = new RegExp(`(?<![a-zA-Z])${prefix}-([0-9.]+)(?![a-zA-Z])`, 'g');
    content = content.replace(regex, (match, value) => {
      // Special check for pt-BR
      if (prefix === 'pt' && match.includes('pt-BR')) return match;

      if (spacingMap[value]) {
        changed = true;
        return `${prefix}-${spacingMap[value]}`;
      }
      return match;
    });
  });

  // 2. Shadow migration
  content = content.replace(/\bshadow-(lg|xl|2xl|soft)\b/g, (match, val) => {
    changed = true;
    return `shadow-${shadowMap[val] || 'premium'}`;
  });

  // 3. Border radius migration
  content = content.replace(/\brounded-(2xl|3xl|premium-sm|premium-lg)\b/g, (match, val) => {
    changed = true;
    return `rounded-${radiusMap[val] || 'premium'}`;
  });

  // 4. Typography migration
  content = content.replace(/\btext-(premium-tiny|premium-base|premium-lg|premium-xl)\b/g, (match, val) => {
    changed = true;
    const tMap: Record<string, string> = {
      'premium-tiny': 'xs',
      'premium-base': 'base',
      'premium-lg': 'lg',
      'premium-xl': 'xl'
    };
    return `text-${tMap[val]}`;
  });

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Migrated: ${filePath}`);
  }
}

function walk(dir: string) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        walk(fullPath);
      }
    } else if (/\.(tsx|ts|css)$/.test(file)) {
      migrateFile(fullPath);
    }
  });
}

console.log('Starting migration pass 2...');
walk('./src');
console.log('Migration pass 2 complete.');
