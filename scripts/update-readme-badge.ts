#!/usr/bin/env bun
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const historyPath = join(process.cwd(), 'reports/compliance-history.json');
if (!readFileSync(historyPath, 'utf8')) {
  process.exit(0);
}

const history = JSON.parse(readFileSync(historyPath, 'utf8'));
const latest = history[history.length - 1];
const previous = history.length > 1 ? history[history.length - 2] : null;

const trend = previous ? (latest.avgTotal >= previous.avgTotal ? '↗️' : '↘️') : '';
const color = latest.avgTotal >= 85 ? 'emerald' : (latest.avgTotal >= 70 ? 'orange' : 'rose');

const badgeUrl = `https://img.shields.io/badge/Design%20System-${latest.avgTotal.toFixed(1)}%25%20Compliance-${color}`;
const readmePath = join(process.cwd(), 'README.md');
let readme = readFileSync(readmePath, 'utf8');

// Update compliance badge
readme = readme.replace(/\[!\[Design System Compliance\].*\]\(.*\)/, `[![Design System Compliance](${badgeUrl})](src/components/cathedra/reports/COMPLIANCE_REPORT.md)`);

writeFileSync(readmePath, readme);
console.log(`Updated README badge: ${latest.avgTotal.toFixed(1)}% ${trend}`);
