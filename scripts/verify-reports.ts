#!/usr/bin/env bun
/**
 * verify-reports.ts
 *
 * Compara a estrutura atual de ./reports com a árvore documentada no README
 * e aponta divergências (arquivos faltando ou inesperados).
 *
 * Uso: npm run reports:verify
 */
import { readdirSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const REPORTS_DIR = "reports";

// Árvore esperada, conforme documentada no README (#### Estrutura de Relatórios e Logs)
const EXPECTED_FILES = [
  "compliance-history.json",
  "token-audit.html",
  "token-audit.json",
];

const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walk(full));
    } else {
      out.push(relative(REPORTS_DIR, full));
    }
  }
  return out;
}

console.log(`${BOLD}🔍 Verificando estrutura de ./${REPORTS_DIR}${RESET}\n`);

if (!existsSync(REPORTS_DIR)) {
  console.log(
    `${RED}✗ Pasta ./${REPORTS_DIR} não encontrada.${RESET}\n` +
      `  Execute: ${BOLD}npm run token-audit:dry-run${RESET} ou ${BOLD}npm run token-audit:report${RESET}\n`
  );
  process.exit(1);
}

const actual = walk(REPORTS_DIR).sort();
const expected = [...EXPECTED_FILES].sort();

const missing = expected.filter((f) => !actual.includes(f));
const unexpected = actual.filter((f) => !expected.includes(f));

console.log(`${BOLD}Documentado no README:${RESET}`);
expected.forEach((f) => console.log(`  - ${f}`));
console.log(`\n${BOLD}Encontrado em ./${REPORTS_DIR}:${RESET}`);
if (actual.length === 0) {
  console.log(`  ${YELLOW}(vazio)${RESET}`);
} else {
  actual.forEach((f) => console.log(`  - ${f}`));
}

console.log("");

let hasDivergence = false;

if (missing.length > 0) {
  hasDivergence = true;
  console.log(`${RED}${BOLD}✗ Arquivos faltando (documentados mas ausentes):${RESET}`);
  missing.forEach((f) => console.log(`  ${RED}- ${f}${RESET}`));
  console.log("");
}

if (unexpected.length > 0) {
  hasDivergence = true;
  console.log(
    `${YELLOW}${BOLD}⚠ Arquivos inesperados (presentes mas não documentados no README):${RESET}`
  );
  unexpected.forEach((f) => console.log(`  ${YELLOW}- ${f}${RESET}`));
  console.log(
    `\n  ${BOLD}Ação:${RESET} atualize a seção "Estrutura de Relatórios e Logs" do README` +
      ` ou remova os arquivos antigos com ${BOLD}npm run token-audit:clean${RESET}.\n`
  );
}

if (!hasDivergence) {
  console.log(
    `${GREEN}${BOLD}✓ Estrutura de ./${REPORTS_DIR} está alinhada com o README.${RESET}\n`
  );
  process.exit(0);
}

console.log(`${RED}${BOLD}Divergências encontradas. Corrija e rode novamente.${RESET}\n`);
process.exit(1);
