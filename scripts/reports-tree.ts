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
const patternFilter = args.find(a => a.startsWith('--pattern='))?.split('=')[1];
const jsonOutput = args.includes('--json');

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const CYAN = "\x1b[36m";

if (!existsSync(REPORTS_DIR)) {
  if (jsonOutput) {
    console.log(JSON.stringify({ error: "Reports directory not found", files: [] }));
  } else {
    console.log(`Pasta ./${REPORTS_DIR} não encontrada.`);
  }
  process.exit(0);
}

const files = readdirSync(REPORTS_DIR).filter(f => !statSync(join(REPORTS_DIR, f)).isDirectory());

const filteredFiles = files.filter(file => {
  if (file === 'compliance-history.json' || file === 'token-audit.html' || file === 'token-audit.json') {
    return !typeFilter && !sinceFilter && !untilFilter && !patternFilter;
  }

  if (typeFilter && !file.includes(`-${typeFilter}-`)) return false;
  
  if (patternFilter) {
    try {
      const regex = new RegExp(patternFilter);
      if (!regex.test(file)) return false;
    } catch (e) {
      // If invalid regex, treat as simple include
      if (!file.includes(patternFilter)) return false;
    }
  }

  const match = file.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
  if (match) {
    const tsStr = match[1].replace(/-/g, (m, offset) => (offset > 10 ? ':' : '-'));
    const fileDate = new Date(tsStr);
    
    if (sinceFilter && fileDate < new Date(sinceFilter)) return false;
    if (untilFilter && fileDate > new Date(untilFilter)) return false;
  } else if (sinceFilter || untilFilter) {
    return false;
  }

  return true;
});

if (jsonOutput) {
  const result = filteredFiles.sort().map(file => {
    const match = file.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
    return {
      name: file,
      timestamp: match ? match[1].replace(/-/g, (m, offset) => (offset > 13 ? ':' : (offset > 10 ? ' ' : '-'))) : null,
      path: join(REPORTS_DIR, file)
    };
  });
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`${BOLD}${CYAN}reports/${RESET}`);
  if (filteredFiles.length === 0) {
    console.log("└── (nenhum arquivo corresponde aos filtros)");
  } else {
    filteredFiles.sort().forEach((file, index) => {
      const isLast = index === filteredFiles.length - 1;
      const prefix = isLast ? "└── " : "├── ";
      
      let comment = "";
      const match = file.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
      if (match) {
          const readable = match[1].replace('T', ' ').replace(/-/g, (m, offset) => (offset > 13 ? ':' : (offset > 10 ? ' ' : '-')));
          comment = `    # [${readable}]`;
      }

      console.log(`${prefix}${file}${comment}`);
    });
  }
}
