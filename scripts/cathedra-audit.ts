#!/usr/bin/env bun
import { execSync } from 'child_process';

const forbiddenPatterns = [
  { 
    name: 'Direct Spacing', 
    regex: '\\b(p|m|gap|space|w|h)-[0-9.]+\\b',
    exclude: ['w-full', 'h-full', 'w-screen', 'h-screen', 'w-auto', 'h-auto', 'w-fit', 'h-fit']
  },
  { 
    name: 'Direct Typography', 
    regex: '\\btext-(xs|sm|base|lg|xl|[2-9]xl)\\b',
    exclude: []
  },
  { 
    name: 'Direct Rounding', 
    regex: '\\brounded-(none|sm|md|lg|xl|2xl|3xl|full)\\b',
    exclude: []
  },
  { 
    name: 'Direct Shadows', 
    regex: '\\bshadow-(sm|md|lg|xl|2xl|inner|none)\\b',
    exclude: []
  }
];

console.log('--- CATHEDRA DESIGN TOKEN COMPLIANCE REPORT ---');
let totalIssues = 0;

forbiddenPatterns.forEach(pattern => {
  console.log(`\nChecking ${pattern.name}...`);
  try {
    // Use ripgrep directly to find matches
    const excludeString = pattern.exclude.map(ex => `-v "${ex}"`).join(' ');
    // We search for the pattern and then filter out the common exclusions
    const command = `rg -o "${pattern.regex}" src --no-filename | grep -E "${pattern.regex}" | sort | uniq -c | sort -nr`;
    
    const output = execSync(command, { encoding: 'utf8' }).trim();
    if (output) {
      // Manual filter for exclusions because grep -v can be tricky with word boundaries
      const lines = output.split('\n').filter(line => {
        const match = line.trim().split(' ')[1];
        return !pattern.exclude.includes(match);
      });
      
      if (lines.length > 0) {
        console.log('Issues found (Count | Pattern):');
        console.log(lines.join('\n'));
        const count = lines.reduce((acc, line) => acc + parseInt(line.trim().split(' ')[0]), 0);
        totalIssues += count;
      } else {
        console.log('✅ Compliant');
      }
    } else {
      console.log('✅ Compliant');
    }
  } catch (error) {
    console.log('✅ Compliant');
  }
});

console.log('\n----------------------------------------------');
if (totalIssues === 0) {
  console.log('PASSED: All components follow Cathedra Design System.');
} else {
  console.log(`FAILED: ${totalIssues} non-compliant classes found.`);
  console.log('Please replace these with Cathedra semantic tokens (e.g., p-spacing-md, text-premium-lg).');
}
