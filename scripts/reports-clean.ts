#!/usr/bin/env bun
/**
 * reports-clean.ts
 * 
 * Remove relatórios de ./reports com base em filtros de data.
 * 
 * Uso: 
 *   npm run reports:clean -- --since=2026-05-01
 *   npm run reports:clean -- --until=2026-05-30
 */
import { readdirSync, existsSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const REPORTS_DIR = "reports";
const args = process.argv.slice(2);

const sinceFilter = args.find(a => a.startsWith('--since='))?.split('=')[1];
const untilFilter = args.find(a => a.startsWith('--until='))?.split('=')[1];

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";

if (!existsSync(REPORTS_DIR)) {
  console.log(`Pasta ./${REPORTS_DIR} não encontrada.`);
  process.exit(0);
}

if (!sinceFilter && !untilFilter) {
  console.log(`${RED}Especifique --since ou --until para limpar arquivos específicos.${RESET}`);
  console.log(`Para limpar tudo, use ${BOLD}npm run token-audit:clean${RESET}`);
  process.exit(1);
}

const files = readdirSync(REPORTS_DIR).filter(f => !statSync(join(REPORTS_DIR, f)).isDirectory());

let deletedCount = 0;

files.forEach(file => {
  // Never clean history or main ones via this script unless we really want to
  if (file === 'compliance-history.json' || file === 'token-audit.html' || file === 'token-audit.json') {
    return;
  }

  const match = file.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
  if (match) {
    const tsStr = match[1].replace(/-/g, (m, offset) => (offset > 10 ? ':' : '-'));
    const fileDate = new Date(tsStr);
    
    let shouldDelete = false;
    if (sinceFilter && fileDate < new Date(sinceFilter)) shouldDelete = true;
    if (untilFilter && fileDate > new Date(untilFilter)) shouldDelete = true;

    if (shouldDelete) {
      unlinkSync(join(REPORTS_DIR, file));
      deletedCount++;
    }
  }
});

console.log(`${GREEN}✓ Limpeza concluída. ${deletedCount} arquivos removidos.${RESET}`);
