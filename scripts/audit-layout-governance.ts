#!/usr/bin/env bun
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { LayoutAllowlistSchema } from './layout-allowlist.schema';

/**
 * CATHEDRA LAYOUT GOVERNANCE AUDIT
 * Blocks PRs if layout utility classes are used outside the allowlist.
 */

const ALLOWLIST_PATH = './layout-allowlist.json';
const forbiddenWrappers = ['max-w-', 'mx-auto', 'container'];

console.log('--- CATHEDRA LAYOUT GOVERNANCE AUDIT ---');

if (!existsSync(ALLOWLIST_PATH)) {
  console.error(`❌ Allowlist file missing at ${ALLOWLIST_PATH}`);
  process.exit(1);
}

let allowlist: string[] = [];
try {
  const rawData = JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf8'));
  const validation = LayoutAllowlistSchema.safeParse(rawData);
  
  if (!validation.success) {
    console.error('❌ Invalid Allowlist Schema:');
    console.error(JSON.stringify(validation.error.format(), null, 2));
    process.exit(1);
  }
  allowlist = validation.data;
} catch (e) {
  console.error(`❌ Failed to parse allowlist at ${ALLOWLIST_PATH}. Ensure it is valid JSON.`);
  process.exit(1);
}

// Check for explicit approval if the allowlist was modified
const isAllowlistModified = process.env.ALLOWLIST_MODIFIED === 'true';
const hasApprovalLabel = process.env.HAS_APPROVAL_LABEL === 'true';

if (isAllowlistModified && !hasApprovalLabel) {
  console.error('\n❌ PERMISSION DENIED:');
  console.error('You have modified "layout-allowlist.json" but the PR lacks the "layout-exception-approved" label.');
  console.error('New exceptions must be explicitly reviewed and approved by a maintainer.\n');
  process.exit(1);
}

console.log(`Allowlist validated: ${allowlist.length} exceptions documented.`);

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
  console.error('3. Ensure the PR has the "layout-exception-approved" label.\n');
  process.exit(1);
}

console.log('✅ Governance Status: PASSED');
console.log('-------------------------------------------\n');

