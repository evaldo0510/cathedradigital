#!/usr/bin/env bun
import { execSync } from 'child_process';

const forbiddenWrappers = [
  'max-w-',
  'mx-auto',
  'container',
  'reader-container',
  'desktop-layout'
];

const exceptions = [
  'src/components/cathedra/ContemplativeLayout.tsx',
  'src/components/cathedra/AppHeader.tsx',
  'src/components/cathedra/ItinerariumStepPage.tsx',
  'src/components/cathedra/AppHeader.tsx',
  'src/components/ui/' // Library components
];

console.log('--- CATHEDRA LAYOUT GOVERNANCE AUDIT ---');

let violationsFound = 0;

forbiddenWrappers.forEach(pattern => {
  try {
    // Exclude library components and valid authorities
    const command = `rg -n "\\b${pattern}" src --glob "!**/node_modules/**" --glob "!src/components/cathedra/ContemplativeLayout.tsx" --glob "!src/components/cathedra/AppHeader.tsx" --glob "!src/components/cathedra/ItinerariumStepPage.tsx" --glob "!src/components/ui/**"`;
    const output = execSync(command, { encoding: 'utf8' }).trim();
    
    if (output) {
      const lines = output.split('\n');
      lines.forEach(line => {
        // If it's max-w-spacing-4xl in AppHeader, it might be caught if glob fails
        console.error(`❌ Layout Wrapper Violation: ${line}`);
        violationsFound++;
      });
    }
  } catch (e) {
    // No matches found
  }
});

if (violationsFound > 0) {
  console.error(`\nFound ${violationsFound} forbidden layout patterns outside allowed components.`);
  process.exit(1);
} else {
  console.log('✅ Layout governance check passed.');
}

