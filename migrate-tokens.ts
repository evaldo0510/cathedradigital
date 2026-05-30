import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const mapping = {
  // Spacing
  '([pm][xytrbl]?|gap)-0(?![0-9])': '$1-spacing-0',
  '([pm][xytrbl]?|gap)-px': '$1-spacing-px',
  '([pm][xytrbl]?|gap)-0\\.5': '$1-spacing-3xs',
  '([pm][xytrbl]?|gap)-1(?![0-9])': '$1-spacing-2xs',
  '([pm][xytrbl]?|gap)-2(?![0-9])': '$1-spacing-xs',
  '([pm][xytrbl]?|gap)-3(?![0-9])': '$1-spacing-sm',
  '([pm][xytrbl]?|gap)-4(?![0-9])': '$1-spacing-md',
  '([pm][xytrbl]?|gap)-6(?![0-9])': '$1-spacing-lg',
  '([pm][xytrbl]?|gap)-8(?![0-9])': '$1-spacing-xl',
  '([pm][xytrbl]?|gap)-12(?![0-9])': '$1-spacing-2xl',
  '([pm][xytrbl]?|gap)-16(?![0-9])': '$1-spacing-3xl',
  '([pm][xytrbl]?|gap)-24(?![0-9])': '$1-spacing-4xl',
  '([pm][xytrbl]?|gap)-32(?![0-9])': '$1-spacing-4xl', // Fallback
  
  // Typography
  'text-xs': 'text-premium-xs',
  'text-sm': 'text-premium-sm',
  'text-base': 'text-premium-base',
  'text-lg': 'text-premium-lg',
  'text-xl': 'text-premium-xl',
  'text-2xl': 'text-premium-2xl',
  'text-3xl': 'text-premium-3xl',
  'text-4xl': 'text-premium-4xl',
  'text-5xl': 'text-premium-5xl',
  
  // Radius
  'rounded-none': 'rounded-premium-none',
  'rounded-sm': 'rounded-premium-sm',
  'rounded-md': 'rounded-premium-md',
  'rounded-lg': 'rounded-premium-lg',
  'rounded-xl': 'rounded-premium',
  'rounded-2xl': 'rounded-premium',
  'rounded-3xl': 'rounded-premium',
  'rounded-full': 'rounded-premium-full',
  
  // Shadow
  'shadow-none': 'shadow-premium-none',
  'shadow-sm': 'shadow-premium-sm',
  'shadow-md': 'shadow-premium-md',
  'shadow-lg': 'shadow-premium',
  'shadow-xl': 'shadow-premium',
  'shadow-2xl': 'shadow-premium',
  'shadow-inner': 'shadow-premium-md', // Fallback
};

function walk(dir: string, callback: (path: string) => void) {
  readdirSync(dir).forEach(f => {
    let dirPath = join(dir, f);
    let isDirectory = statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(dirPath);
  });
}

const targetDir = 'src';
const extensions = ['.tsx', '.ts', '.css'];

walk(targetDir, (filePath) => {
  if (extensions.some(ext => filePath.endsWith(ext))) {
    let content = readFileSync(filePath, 'utf8');
    let original = content;
    
    for (const [regexStr, replacement] of Object.entries(mapping)) {
      const regex = new RegExp(regexStr, 'g');
      content = content.replace(regex, replacement);
    }
    
    if (content !== original) {
      console.log(`Updated: ${filePath}`);
      writeFileSync(filePath, content);
    }
  }
});

console.log('Migration complete.');
