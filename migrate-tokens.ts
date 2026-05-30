import fs from 'fs';
import path from 'path';

const spacingMap: Record<string, string> = {
  '0': '0',
  '0.5': '3xs',
  '1': '2xs',
  '1.5': '2xs', // approx
  '2': 'xs',
  '2.5': 'xs', // approx
  '3': 'sm',
  '3.5': 'sm', // approx
  '4': 'md',
  '5': 'md', // approx
  '6': 'lg',
  '7': 'lg', // approx
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
};

const shadowMap: Record<string, string> = {
  'sm': 'sm',
  'md': 'md',
  'lg': 'premium',
  'xl': 'premium',
  '2xl': 'premium',
};

const radiusMap: Record<string, string> = {
  'sm': 'sm',
  'md': 'md',
  'lg': 'lg',
  'xl': 'xl',
  '2xl': 'premium',
  '3xl': 'premium',
};

const prefixes = ['p', 'm', 'w', 'h', 'gap', 'space', 'top', 'bottom', 'left', 'right', 'px', 'py', 'pt', 'pb', 'pl', 'pr', 'mx', 'my', 'mt', 'mb', 'ml', 'mr', 'inset', 'size'];

function migrateFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Spacing migration
  prefixes.forEach(prefix => {
    // Look for prefix-number, but not prefix-[...], prefix-px, etc.
    const regex = new RegExp(`\\b${prefix}-([0-9.]+)\\b`, 'g');
    content = content.replace(regex, (match, value) => {
      if (spacingMap[value]) {
        changed = true;
        return `${prefix}-${spacingMap[value]}`;
      }
      return match;
    });
  });

  // 2. Shadow migration
  content = content.replace(/\bshadow-(lg|xl|2xl)\b/g, (match, val) => {
    changed = true;
    return `shadow-premium`;
  });

  // 3. Border radius migration
  content = content.replace(/\brounded-(2xl|3xl)\b/g, (match, val) => {
    changed = true;
    return `rounded-premium`;
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

console.log('Starting migration...');
walk('./src');
console.log('Migration complete.');
