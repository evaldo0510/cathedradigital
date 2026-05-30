import fs from 'fs';
import path from 'path';

const allowedSpacing = ['0', 'px', '3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', 'spacing-3xs', 'spacing-2xs', 'spacing-xs', 'spacing-sm', 'spacing-md', 'spacing-lg', 'spacing-xl', 'spacing-2xl', 'spacing-3xl', 'spacing-4xl', 'full', 'auto', 'screen', 'min', 'max', 'fit'];
const allowedRadius = ['none', 'sm', 'md', 'lg', 'xl', 'premium', 'full'];
const allowedShadow = ['none', 'sm', 'md', 'premium', 'premium-hover'];
const allowedFontSize = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'];

const prefixes = ['p', 'm', 'w', 'h', 'gap', 'space', 'top', 'bottom', 'left', 'right', 'px', 'py', 'pt', 'pb', 'pl', 'pr', 'mx', 'my', 'mt', 'mb', 'ml', 'mr', 'inset', 'size'];

const report: Record<string, string[]> = {};

function auditFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Regex for spacing
  prefixes.forEach(prefix => {
    const regex = new RegExp(`\\b${prefix}-([^\\s\\"'\\{\\}\\(\\)\\[\\]!]+)\\b`, 'g');
    let match;
    while ((match = regex.exec(content)) !== null) {
      const value = match[1];
      if (!allowedSpacing.includes(value) && !value.includes('/') && !value.startsWith('[') && !/^[0-9]+%$/.test(value)) {
        addViolation(filePath, `Spacing: ${match[0]} (use spacing-*)`);
      }
    }
  });

  // Radius
  const radiusRegex = /\brounded-([^\s\"'\{\}\(\)\[\]!]+)\b/g;
  let rMatch;
  while ((rMatch = radiusRegex.exec(content)) !== null) {
    const value = rMatch[1];
    if (!allowedRadius.includes(value) && !value.startsWith('[')) {
      addViolation(filePath, `Radius: ${rMatch[0]} (use rounded-premium)`);
    }
  }

  // Shadow
  const shadowRegex = /\bshadow-([^\s\"'\{\}\(\)\[\]!]+)\b/g;
  let sMatch;
  while ((sMatch = shadowRegex.exec(content)) !== null) {
    const value = sMatch[1];
    if (!allowedShadow.includes(value) && !value.startsWith('[')) {
      addViolation(filePath, `Shadow: ${sMatch[0]} (use shadow-premium)`);
    }
  }

  // Font size
  const fontRegex = /\btext-([^\s\"'\{\}\(\)\[\]!]+)\b/g;
  let fMatch;
  while ((fMatch = fontRegex.exec(content)) !== null) {
    const value = fMatch[1];
    // Skip colors, which also use text-*
    const commonColors = ['white', 'black', 'transparent', 'current', 'primary', 'secondary', 'accent', 'muted', 'destructive', 'popover', 'card', 'background', 'foreground', 'border', 'input', 'ring'];
    if (!allowedFontSize.includes(value) && !commonColors.some(c => value.includes(c)) && !value.startsWith('[') && !value.includes('/')) {
      // Potentially a font size violation
      addViolation(filePath, `Typography: ${fMatch[0]} (use semantic tokens)`);
    }
  }
}

function addViolation(file: string, msg: string) {
  if (!report[file]) report[file] = [];
  if (!report[file].includes(msg)) report[file].push(msg);
}

function walk(dir: string) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') walk(fullPath);
    } else if (/\.(tsx|ts)$/.test(file)) {
      auditFile(fullPath);
    }
  });
}

walk('./src');

console.log('# CATHEDRA DESIGN TOKEN COMPLIANCE REPORT\n');
for (const [file, violations] of Object.entries(report)) {
  console.log(`## ${file}`);
  violations.forEach(v => console.log(`- [ ] ${v}`));
  console.log('');
}
