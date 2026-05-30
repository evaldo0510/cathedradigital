#!/usr/bin/env bun
/**
 * verify-reports.ts
 *
 * Compara a estrutura atual de ./reports com a árvore documentada no README.
 * Suporta o modo --update para atualizar o README automaticamente.
 *
 * Uso: 
 *   npm run reports:verify
 *   npm run reports:verify -- --update
 */
import { readdirSync, existsSync, statSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const REPORTS_DIR = "reports";
const README_PATH = "README.md";
const args = process.argv.slice(2);
const updateMode = args.includes("--update");

const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";

if (!existsSync(REPORTS_DIR)) {
  console.log(`${RED}✗ Pasta ./${REPORTS_DIR} não encontrada.${RESET}`);
  process.exit(1);
}

function getActualFiles() {
  return readdirSync(REPORTS_DIR)
    .filter(f => !statSync(join(REPORTS_DIR, f)).isDirectory())
    .sort();
}

function validateJsonFiles(files: string[]) {
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  const corrupted: string[] = [];
  
  jsonFiles.forEach(file => {
    const content = readFileSync(join(REPORTS_DIR, file), 'utf8');
    try {
      const data = JSON.parse(content);
      // Basic schema check
      if (file === 'compliance-history.json') {
        if (!Array.isArray(data)) throw new Error("History must be an array");
      } else if (file.startsWith('token-audit')) {
        if (!data.timestamp || typeof data.totalIssues !== 'number') throw new Error("Invalid audit report structure");
      }
    } catch (e) {
      corrupted.push(file);
    }
  });
  return corrupted;
}

function generateTreeString(files: string[]) {
  let tree = "reports/\n";
  files.forEach((file, index) => {
    const isLast = index === files.length - 1;
    const prefix = isLast ? "└── " : "├── ";
    
    let comment = "";
    if (file === 'compliance-history.json') comment = "    # Histórico de progresso";
    else if (file === 'token-audit.html') comment = "           # Dashboard visual (mais recente)";
    else if (file === 'token-audit.json') comment = "           # Logs técnicos brutos (mais recente)";
    else {
      const match = file.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
      if (match) {
        const readable = match[1].replace('T', ' ').replace(/-/g, (m, offset) => (offset > 13 ? ':' : (offset > 10 ? ' ' : '-')));
        comment = `    # [${readable}] Log histórico`;
      }
    }
    
    tree += `${prefix}${file}${comment}\n`;
  });
  return tree;
}

if (updateMode) {
  console.log(`${BOLD}🔄 Atualizando árvore no README...${RESET}`);
  const actualFiles = getActualFiles();
  const treeStr = generateTreeString(actualFiles);
  
  if (!existsSync(README_PATH)) {
    console.log(`${RED}✗ ${README_PATH} não encontrado.${RESET}`);
    process.exit(1);
  }
  
  let readmeContent = readFileSync(README_PATH, "utf8");
  const treeRegex = /#### Estrutura de Relatórios e Logs \(Exemplo Real\)\n\nAo executar `npm run token-audit:dry-run` ou `npm run token-audit:report`, a pasta `\.\/reports` é populada com a seguinte estrutura:\n\n```text\n([\s\S]*?)```/;
  
  if (treeRegex.test(readmeContent)) {
    const newContent = readmeContent.replace(treeRegex, (match, p1) => {
      return match.replace(p1, treeStr);
    });
    writeFileSync(README_PATH, newContent);
    console.log(`${GREEN}✓ README.md atualizado com sucesso.${RESET}`);
  } else {
    console.log(`${RED}✗ Não foi possível encontrar a seção da árvore no README.${RESET}`);
    process.exit(1);
  }
  process.exit(0);
}

// Verification Mode
console.log(`${BOLD}🔍 Verificando estrutura de ./${REPORTS_DIR}${RESET}\n`);

const actualFiles = getActualFiles();
const readmeContent = readFileSync(README_PATH, "utf8");
const treeRegex = /```text\nreports\/\n([\s\S]*?)```/;
const match = readmeContent.match(treeRegex);

if (!match) {
  console.log(`${RED}✗ Não foi possível extrair a árvore documentada do README.${RESET}`);
  process.exit(1);
}

const documentedFiles = match[1]
  .split("\n")
  .map(line => {
    const m = line.match(/[├└]──\s+([^\s#]+)/);
    return m ? m[1] : null;
  })
  .filter(Boolean) as string[];

const missing = documentedFiles.filter(f => !actualFiles.includes(f));
const unexpected = actualFiles.filter(f => !documentedFiles.includes(f));

console.log(`${BOLD}Documentado no README:${RESET}`);
documentedFiles.forEach(f => console.log(`  - ${f}`));
console.log(`\n${BOLD}Encontrado em ./${REPORTS_DIR}:${RESET}`);
actualFiles.forEach(f => console.log(`  - ${f}`));

console.log("");

let hasDivergence = false;
if (missing.length > 0) {
  hasDivergence = true;
  console.log(`${RED}${BOLD}✗ Arquivos faltando:${RESET}`);
  missing.forEach(f => console.log(`  ${RED}- ${f}${RESET}`));
}

if (unexpected.length > 0) {
  hasDivergence = true;
  console.log(`${YELLOW}${BOLD}⚠ Arquivos inesperados:${RESET}`);
  unexpected.forEach(f => console.log(`  ${YELLOW}- ${f}${RESET}`));
  console.log(`\n  ${BOLD}Dica:${RESET} Rode ${BOLD}npm run reports:verify -- --update${RESET} para sincronizar.`);
}

if (!hasDivergence) {
  console.log(`${GREEN}${BOLD}✓ Estrutura está alinhada.${RESET}`);
  process.exit(0);
}

process.exit(1);
