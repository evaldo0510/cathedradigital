#!/usr/bin/env bun
/**
 * reports-tree.ts
 * 
 * Imprime a árvore de arquivos em ./reports com suporte a filtros por tipo e timestamp.
 * 
 * Uso: 
 *   npm run reports:tree
 *   npm run reports:tree -- --type=dry-run
 *   npm run reports:tree -- --since=2026-05-30
 *   npm run reports:tree -- --until=2026-05-30
 */
import { readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const REPORTS_DIR = "reports";
const args = process.argv.slice(2);

const typeFilter = args.find(a => a.startsWith('--type='))?.split('=')[1];
const sinceFilter = args.find(a => a.startsWith('--since='))?.split('=')[1];
const untilFilter = args.find(a => a.startsWith('--until='))?.split('=')[1];

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const CYAN = "\x1b[36m";

if (!existsSync(REPORTS_DIR)) {
  console.log(`Pasta ./${REPORTS_DIR} não encontrada.`);
  process.exit(0);
}

const files = readdirSync(REPORTS_DIR).filter(f => !statSync(join(REPORTS_DIR, f)).isDirectory());

const filteredFiles = files.filter(file => {
  // Always include compliance-history.json and the latest generic ones? 
  // User asked to filter the tree, so maybe they want to see everything that matches.
  if (file === 'compliance-history.json' || file === 'token-audit.html' || file === 'token-audit.json') {
    return !typeFilter && !sinceFilter && !untilFilter;
  }

  const parts = file.split('-');
  // Expected format: token-audit-<type>-<YYYY>-<MM>-<DD>T<HH>-<mm>-<ss>.<ext>
  // parts[2] should be the type
  if (typeFilter && !file.includes(`-${typeFilter}-`)) return false;

  // Extract timestamp part: <YYYY>-<MM>-<DD>T<HH>-<mm>-<ss>
  // It starts after the type. 
  // Let's find the timestamp.
  const match = file.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
  if (match) {
    const tsStr = match[1].replace(/-/g, (m, offset) => (offset > 10 ? ':' : '-')); // Convert back to ISO-ish for parsing
    const fileDate = new Date(tsStr);
    
    if (sinceFilter && fileDate < new Date(sinceFilter)) return false;
    if (untilFilter && fileDate > new Date(untilFilter)) return false;
  } else {
    // If no timestamp and we have filters, exclude it (except the main ones if no filters)
    if (sinceFilter || untilFilter) return false;
  }

  return true;
});

console.log(`${BOLD}${CYAN}reports/${RESET}`);
if (filteredFiles.length === 0) {
  console.log("└── (nenhum arquivo corresponde aos filtros)");
} else {
  filteredFiles.sort().forEach((file, index) => {
    const isLast = index === filteredFiles.length - 1;
    const prefix = isLast ? "└── " : "├── ";
    
    // Add a comment with a readable timestamp if possible
    let comment = "";
    const match = file.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
    if (match) {
        const readable = match[1].replace('T', ' ').replace(/-/g, (m, offset) => (offset > 13 ? ':' : (offset > 10 ? ' ' : '-')));
        comment = `    # [${readable}]`;
    }

    console.log(`${prefix}${file}${comment}`);
  });
}
