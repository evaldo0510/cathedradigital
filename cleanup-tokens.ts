import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const mapping = {
  // Spacing (using word boundaries to avoid matching inside other tokens)
  '\\b([pm][xytrbl]?|gap)-0\\b': '$1-spacing-0',
  '\\b([pm][xytrbl]?|gap)-px\\b': '$1-spacing-px',
  '\\b([pm][xytrbl]?|gap)-0\\.5\\b': '$1-spacing-3xs',
  '\\b([pm][xytrbl]?|gap)-1\\b': '$1-spacing-2xs',
  '\\b([pm][xytrbl]?|gap)-2\\b': '$1-spacing-xs',
  '\\b([pm][xytrbl]?|gap)-3\\b': '$1-spacing-sm',
  '\\b([pm][xytrbl]?|gap)-4\\b': '$1-spacing-md',
  '\\b([pm][xytrbl]?|gap)-6\\b': '$1-spacing-lg',
  '\\b([pm][xytrbl]?|gap)-8\\b': '$1-spacing-xl',
  '\\b([pm][xytrbl]?|gap)-12\\b': '$1-spacing-2xl',
  '\\b([pm][xytrbl]?|gap)-16\\b': '$1-spacing-3xl',
  '\\b([pm][xytrbl]?|gap)-24\\b': '$1-spacing-4xl',
  '\\b([pm][xytrbl]?|gap)-32\\b': '$1-spacing-4xl',
  
  // Typography
  '\\btext-xs\\b': 'text-premium-xs',
  '\\btext-sm\\b': 'text-premium-sm',
  '\\btext-base\\b': 'text-premium-base',
  '\\btext-lg\\b': 'text-premium-lg',
  '\\btext-xl\\b': 'text-premium-xl',
  '\\btext-2xl\\b': 'text-premium-2xl',
  '\\btext-3xl\\b': 'text-premium-3xl',
  '\\btext-4xl\\b': 'text-premium-4xl',
  '\\btext-5xl\\b': 'text-premium-5xl',
  '\\btext-6xl\\b': 'text-premium-6xl',
  '\\btext-7xl\\b': 'text-premium-7xl',
  '\\btext-8xl\\b': 'text-premium-8xl',
  '\\btext-9xl\\b': 'text-premium-9xl',
  
  // Radius
  '\\brounded-none\\b': 'rounded-premium-none',
  '\\brounded-sm\\b': 'rounded-premium-sm',
  '\\brounded-md\\b': 'rounded-premium-md',
  '\\brounded-lg\\b': 'rounded-premium-lg',
  '\\brounded-xl\\b': 'rounded-premium',
  '\\brounded-2xl\\b': 'rounded-premium',
  '\\brounded-3xl\\b': 'rounded-premium',
  '\\brounded-full\\b': 'rounded-premium-full',
  
  // Shadow
  '\\bshadow-none\\b': 'shadow-premium-none',
  '\\bshadow-sm\\b': 'shadow-premium-sm',
  '\\bshadow-md\\b': 'shadow-premium-md',
  '\\bshadow-lg\\b': 'shadow-premium',
  '\\bshadow-xl\\b': 'shadow-premium',
  '\\bshadow-2xl\\b': 'shadow-premium',
  '\\bshadow-inner\\b': 'shadow-premium-md',
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
    // Skip snapshots and scripts
    if (filePath.includes('__snapshots__') || filePath.includes('scripts/')) return;
    
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

console.log('Cleanup migration complete.');
