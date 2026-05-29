import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Spacing Audit Script
 * Scans the codebase for Tailwind spacing classes that don't match the project's rhythm tokens.
 */

const TARGET_DIRS = ['src/components', 'src/pages'];
const EXTENSIONS = ['.tsx', '.ts'];

// Allowed tokens or patterns
const ALLOWED_SPACING_CLASSES = [
  'section-rhythm',
  'stack-rhythm',
  'stack-rhythm-lg',
  'padding-rhythm',
  'header-margin-rhythm',
  // Layout utilities that are usually okay
  'p-0', 'm-0', 'mx-auto', 'my-auto',
  'p-px', 'm-px',
];

// Tailwind classes to flag (px-1, py-2, etc.)
const SPACING_REGEX = /\b(p[xy]?|m[xy]?)-(\d+|\[.+\])\b/g;

interface Violation {
  file: string;
  line: number;
  content: string;
  foundClass: string;
}

const violations: Violation[] = [];

function auditFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    let match;
    while ((match = SPACING_REGEX.exec(line)) !== null) {
      const fullClass = match[0];
      
      // Skip if the element also has one of the allowed rhythm tokens on the same line (heuristic)
      const hasToken = ALLOWED_SPACING_CLASSES.some(token => line.includes(token));
      
      // We flag common spacing values that should probably be tokens
      // Standard tailwind p-4, m-8, etc.
      if (!hasToken && !ALLOWED_SPACING_CLASSES.includes(fullClass)) {
        violations.push({
          file: filePath,
          line: index + 1,
          content: line.trim(),
          foundClass: fullClass
        });
      }
    }
  });
}

function walkDir(dir: string) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (EXTENSIONS.includes(path.extname(file))) {
      auditFile(fullPath);
    }
  });
}

console.log('🚀 Starting Spacing Rhythm Audit...');

TARGET_DIRS.forEach(dir => {
  if (fs.existsSync(dir)) {
    walkDir(dir);
  }
});

// Generate Report
const reportPath = 'spacing-audit-report.json';
fs.writeFileSync(reportPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  totalViolations: violations.length,
  violations
}, null, 2));

console.log(`\n📊 Audit Complete!`);
console.log(`Total non-token spacing violations found: ${violations.length}`);
console.log(`Detailed report saved to: ${reportPath}`);

if (violations.length > 0) {
  console.log('\nTop 5 violations:');
  violations.slice(0, 5).forEach(v => {
    console.log(`- ${v.file}:${v.line} -> Found "${v.foundClass}" in: ${v.content.substring(0, 60)}...`);
  });
}

// Exit with error if in CI and violations found
if (process.env.CI && violations.length > 50) { // Threshold for migration
  console.error('\n❌ Too many spacing violations. Please use rhythm tokens.');
  process.exit(1);
}
