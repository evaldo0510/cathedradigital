import fs from 'fs';
import path from 'path';

const tokens = ['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'];
const prefixes = ['p', 'm', 'w', 'h', 'gap', 'space-x', 'space-y', 'top', 'bottom', 'left', 'right', 'px', 'py', 'pt', 'pb', 'pl', 'pr', 'mx', 'my', 'mt', 'mb', 'ml', 'mr', 'inset', 'size'];

function migrateFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  tokens.forEach(token => {
    prefixes.forEach(prefix => {
      // Look for p-xs and turn into p-spacing-xs
      // But avoid p-spacing-xs-spacing-xs
      const regex = new RegExp(`(?<![a-zA-Z])${prefix}-(?!spacing-)${token}(?![a-zA-Z])`, 'g');
      content = content.replace(regex, (match) => {
        changed = true;
        return `${prefix}-spacing-${token}`;
      });
    });
  });

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Prefixed: ${filePath}`);
  }
}

function walk(dir: string) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') walk(fullPath);
    } else if (/\.(tsx|ts|css)$/.test(file)) migrateFile(fullPath);
  });
}

walk('./src');
console.log('Done prefixing.');
