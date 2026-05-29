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
const report = {
  timestamp: new Date().toISOString(),
  totalViolations: violations.length,
  violations
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

// Generate Readable Summary for CI
const summaryPath = 'spacing-audit-summary.txt';
let summary = `📊 SPACING RHYTHM AUDIT SUMMARY\n`;
summary += `================================\n`;
summary += `Generated: ${report.timestamp}\n`;
summary += `Total Violations: ${report.totalViolations}\n\n`;

if (violations.length > 0) {
  summary += `🔥 TOP VIOLATED FILES:\n`;
  const fileCounts: Record<string, number> = {};
  violations.forEach(v => {
    fileCounts[v.file] = (fileCounts[v.file] || 0) + 1;
  });

  const sortedFiles = Object.entries(fileCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  sortedFiles.forEach(([file, count]) => {
    summary += `- ${file}: ${count} violations\n`;
  });

  summary += `\n📝 RECENT VIOLATIONS DETAILS:\n`;
  violations.slice(0, 15).forEach(v => {
    summary += `[${v.foundClass}] at ${v.file}:${v.line} -> "${v.content.substring(0, 100)}"\n`;
  });
} else {
  summary += `✅ Perfect! No spacing rhythm violations found.\n`;
}

fs.writeFileSync(summaryPath, summary);

console.log(`\n📊 Audit Complete!`);
console.log(`Total non-token spacing violations found: ${violations.length}`);
console.log(`Detailed report: ${reportPath}`);
console.log(`Readable summary: ${summaryPath}`);

if (violations.length > 0) {
  console.log('\n--- SUMMARY PREVIEW ---');
  console.log(summary.substring(0, 500) + '...');
}

// Exit with error if in CI and violations found
if (process.env.CI && violations.length > 0) {
  console.error('\n❌ Spacing rhythm violations found. Please use the standardized tokens.');
  process.exit(1);
}
