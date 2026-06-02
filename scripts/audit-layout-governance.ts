#!/usr/bin/env bun
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

/**
 * CATHEDRA LAYOUT GOVERNANCE AUDIT
 * Blocks PRs if layout utility classes are used outside the allowlist.
 */

const ALLOWLIST_PATH = './layout-allowlist.json';
const forbiddenWrappers = ['max-w-', 'mx-auto', 'container'];

let allowlist: string[] = [];
try {
  allowlist = JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf8'));
} catch (e) {
  console.error(`❌ Failed to read allowlist at ${ALLOWLIST_PATH}`);
  process.exit(1);
}

console.log('--- CATHEDRA LAYOUT GOVERNANCE AUDIT ---');
console.log(`Allowlist versioned at: ${ALLOWLIST_PATH}`);

let violationsFound = 0;
const violationDetails: { file: string; line: number; content: string }[] = [];

forbiddenWrappers.forEach(pattern => {
  try {
    // Search in src, excluding tests, snaps, and node_modules
    const command = `rg -n "\\b${pattern}" src --glob "!**/*.test.tsx" --glob "!**/*.spec.ts" --glob "!**/*.snap" --glob "!node_modules/**"`;
    const output = execSync(command, { encoding: 'utf8' }).trim();
    
    if (output) {
      const lines = output.split('\n');
      lines.forEach(line => {
        const parts = line.split(':');
        const filePath = parts[0];
        const lineNumber = parseInt(parts[1]);
        const content = parts.slice(2).join(':').trim();

        // Check if file or directory is in allowlist
        const isAllowed = allowlist.some(ex => filePath.includes(ex));
        if (isAllowed) return;

        // Skip specific utility cases that aren't structural layout
        if (content.includes('max-w-none') || content.includes('max-w-fit') || content.includes('max-w-[12px]')) return;

        violationDetails.push({ file: filePath, line: lineNumber, content });
        violationsFound++;
      });
    }
  } catch (e) {
    // No matches for this pattern
  }
});

if (violationsFound > 0) {
  console.error('\n❌ VIOLATIONS DETECTED:');
  console.error('The following files use restricted layout utilities outside the allowlist:');
  violationDetails.forEach(v => {
    console.error(`  - ${v.file}:${v.line} -> ${v.content}`);
  });
  console.error('\nHow to fix:');
  console.error('1. Move the layout logic to ContemplativeLayout if possible.');
  console.error(`2. If this is a valid exception, add the file path to "${ALLOWLIST_PATH}".`);
  console.error('3. Commit the updated allowlist with your PR.\n');
  process.exit(1);
}

console.log('✅ Governance Status: PASSED');
console.log(`- Active Violations: 0`);
console.log(`- Documented Exceptions: ${allowlist.length}`);
console.log('-------------------------------------------\n');
