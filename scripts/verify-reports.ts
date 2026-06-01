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

const REPORTS_DIR = process.env.REPORTS_DIR_OVERRIDE || "reports";
const README_PATH = process.env.README_PATH_OVERRIDE || "README.md";
const args = process.argv.slice(2);
const updateMode = args.includes("--update");
const dryRun = args.includes("--dry-run");
const failOnDivergence = args.includes("--fail-on-divergence") || process.env.REPORTS_FAIL_ON_DIVERGENCES === 'true';

const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";

// Helper to write GitHub Actions annotations and summaries
function annotate(type: 'error' | 'warning' | 'notice', message: string, file?: string) {
  if (process.env.GITHUB_ACTIONS) {
    const filePart = file ? `,file=${file}` : '';
    console.log(`::${type}${filePart}::${message}`);
  }
}

function writeSummary(content: string) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    let finalContent = content;
    
    // Add override information if active
    if (process.env.REPORTS_DIR_OVERRIDE || process.env.README_PATH_OVERRIDE) {
      finalContent += `#### ⚙️ Configuração Customizada (Overrides)\n`;
      if (process.env.REPORTS_DIR_OVERRIDE) {
        finalContent += `- 📁 **Diretório de Relatórios:** \`${REPORTS_DIR}\` (via \`REPORTS_DIR_OVERRIDE\`)\n`;
      }
      if (process.env.README_PATH_OVERRIDE) {
        finalContent += `- 📖 **Caminho do README:** \`${README_PATH}\` (via \`README_PATH_OVERRIDE\`)\n`;
      }
      finalContent += `\n`;
    }
    
    appendFileSync(summaryPath, finalContent + "\n");
  }
}

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
    const filePath = join(REPORTS_DIR, file);
    const content = readFileSync(filePath, 'utf8');
    try {
      const data = JSON.parse(content);
      // Basic schema check
      if (file === 'compliance-history.json') {
        if (!Array.isArray(data)) throw new Error("History must be an array");
      } else if (file.startsWith('token-audit')) {
        if (!data.timestamp || typeof data.totalIssues !== 'number') throw new Error("Invalid audit report structure");
      }
    } catch (e: any) {
      corrupted.push(file);
      annotate('error', `Relatório JSON corrompido ou inválido: ${e.message}`, filePath);
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
    else if (file === 'security-audit.json') comment = "        # Relatório de segurança Supabase";
    else if (file === 'spacing-audit-report.json') comment = "  # Auditoria de espaçamento e ritmo";
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
  
  // JSON Validation first
  const corrupted = validateJsonFiles(actualFiles);
  if (corrupted.length > 0) {
    console.log(`${RED}✗ Relatórios JSON corrompidos detectados: ${corrupted.join(', ')}${RESET}`);
    process.exit(1);
  }

  const treeStr = generateTreeString(actualFiles);
  
  if (!existsSync(README_PATH)) {
    console.log(`${RED}✗ ${README_PATH} não encontrado.${RESET}`);
    process.exit(1);
  }
  
  let readmeContent = readFileSync(README_PATH, "utf8");
  const treeRegex = /#### Estrutura de Relatórios e Logs \(Exemplo Real\)\n\nAo executar `npm run token-audit:dry-run` ou `npm run token-audit:report`, a pasta `\.\/reports` é populada com a seguinte estrutura:\n\n```text\n([\s\S]*?)```/;
  
  let hasDivergence = false; // For summary purposes in update mode
  
  if (treeRegex.test(readmeContent)) {
    const oldTreeMatch = readmeContent.match(treeRegex);
    const oldTree = oldTreeMatch ? oldTreeMatch[1] : "";
    hasDivergence = oldTree.trim() !== treeStr.trim();

    if (dryRun) {
      console.log(`${YELLOW}${BOLD}⚠ Modo DRY RUN: Nenhuma alteração será feita.${RESET}`);
      console.log(`${BOLD}Divergências detectadas que seriam aplicadas:${RESET}\n`);
      console.log(treeStr);
      
      if (process.env.GITHUB_ACTIONS) {
        let summary = `### 📊 Relatório de Verificação de Estrutura\n\n`;
        summary += `⚠️ **Status:** Simulação (Dry Run)\n`;
        summary += `📝 **Motivo do Exit Code:** Modo Dry Run ativo; nenhuma alteração persistida.\n\n`;
        writeSummary(summary);
      }
      process.exit(0);
    }

    const newContent = readmeContent.replace(treeRegex, (match, p1) => {
      return match.replace(p1, treeStr);
    });
    writeFileSync(README_PATH, newContent);
    
    // Generate divergences.md
    let divergenceContent = "# Resumo de Atualização dos Relatórios\n\n";
    divergenceContent += `Data: ${new Date().toLocaleString()}\n\n`;
    divergenceContent += "## Mudanças na Árvore\n\n";
    divergenceContent += "### Anterior\n```text\n" + oldTree + "```\n\n";
    divergenceContent += "### Novo\n```text\n" + treeStr + "```\n";
    
    writeFileSync("divergences.md", divergenceContent);
    
    if (process.env.GITHUB_ACTIONS) {
      let summary = `### 📊 Relatório de Verificação de Estrutura\n\n`;
      if (hasDivergence) {
        summary += `🔄 **Status:** Sincronizado\n`;
        summary += `📝 **Motivo do Exit Code:** README atualizado automaticamente.\n\n`;
      } else {
        summary += `✅ **Status:** Sucesso (Já Sincronizado)\n`;
        summary += `📝 **Motivo do Exit Code:** Nenhuma divergência detectada; README mantido.\n\n`;
      }
      writeSummary(summary);
    }

    console.log(`${GREEN}✓ README.md atualizado com sucesso.${RESET}`);
    console.log(`${BOLD}i Resumo gerado em divergences.md${RESET}`);
  } else {
    console.log(`${RED}✗ Não foi possível encontrar a seção da árvore no README.${RESET}`);
    process.exit(1);
  }
  process.exit(0);
}

// Verification Mode
console.log(`${BOLD}🔍 Verificando estrutura de ./${REPORTS_DIR}${RESET}\n`);

const actualFiles = getActualFiles();

// JSON Validation
const corrupted = validateJsonFiles(actualFiles);
if (corrupted.length > 0) {
  console.log(`${RED}✗ Relatórios JSON corrompidos detectados:${RESET}`);
  corrupted.forEach(f => console.log(`  - ${f}`));
  console.log("");
  
  if (process.env.GITHUB_ACTIONS) {
    let summary = `### 📊 Relatório de Verificação de Estrutura\n\n`;
    summary += `❌ **Status:** Falha (JSON Corrompido)\n`;
    summary += `📝 **Motivo do Exit Code:** Relatórios JSON corrompidos ou com schema inválido detectados.\n\n`;
    summary += `#### 🚨 Arquivos Corrompidos (${corrupted.length})\n`;
    corrupted.forEach(f => summary += `- \`${f}\` (JSON inválido)\n`);
    writeSummary(summary);
  }
  
  process.exit(1);
}


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
  missing.forEach(f => {
    console.log(`  ${RED}- ${f}${RESET}`);
    annotate('error', `Arquivo documentado no README mas ausente em ./${REPORTS_DIR}: ${f}`, README_PATH);
  });
}

if (unexpected.length > 0) {
  hasDivergence = true;
  console.log(`${YELLOW}${BOLD}⚠ Arquivos inesperados:${RESET}`);
  unexpected.forEach(f => {
    console.log(`  ${YELLOW}- ${f}${RESET}`);
    annotate('warning', `Arquivo presente em ./${REPORTS_DIR} mas não documentado no README: ${f}`, README_PATH);
  });
  console.log(`\n  ${BOLD}Dica:${RESET} Rode ${BOLD}npm run reports:verify -- --update${RESET} para sincronizar.`);
}

// GitHub Summary Generation
if (process.env.GITHUB_ACTIONS) {
  let summary = `### 📊 Relatório de Verificação de Estrutura\n\n`;
  
  // Status with Exit Reason
  if (!hasDivergence) {
    summary += `✅ **Status:** Sucesso (Estrutura Alinhada)\n`;
    summary += `📝 **Motivo do Exit Code:** Nenhuma divergência detectada.\n\n`;
  } else if (failOnDivergence) {
    summary += `❌ **Status:** Falha (Divergência Detectada)\n`;
    summary += `📝 **Motivo do Exit Code:** Divergências encontradas com \`--fail-on-divergence\` ativo.\n\n`;
  } else {
    summary += `⚠️ **Status:** Aviso (Divergência Detectada)\n`;
    summary += `📝 **Motivo do Exit Code:** Divergências encontradas, mas o modo de falha está desativado.\n\n`;
  }

  if (hasDivergence) {
    summary += `#### 🔍 Detalhes das Divergências\n\n`;
    if (corrupted.length > 0) {
      summary += `#### 🚨 Arquivos Corrompidos (${corrupted.length})\n`;
      corrupted.forEach(f => summary += `- \`${f}\` (JSON inválido)\n`);
    }
    if (missing.length > 0) {
      summary += `#### Missing Files (${missing.length})\n`;
      missing.forEach(f => summary += `- \`${f}\` (Documentado no README mas não encontrado)\n`);
    }
    if (unexpected.length > 0) {
      summary += `#### Unexpected Files (${unexpected.length})\n`;
      unexpected.forEach(f => summary += `- \`${f}\` (Presente em \`./reports\` mas não documentado)\n`);
      summary += `\n> **Dica:** Rode \`npm run reports:verify -- --update\` localmente para sincronizar.\n`;
    }
  }
  writeSummary(summary);
}

if (!hasDivergence) {
  console.log(`${GREEN}${BOLD}✓ Estrutura está alinhada.${RESET}`);
  process.exit(0);
}

if (failOnDivergence) {
  console.log(`${RED}${BOLD}Divergências encontradas. Finalizando com erro (REPORTS_FAIL_ON_DIVERGENCES=true).${RESET}\n`);
  process.exit(1);
}

console.log(`${YELLOW}${BOLD}Divergências encontradas, mas o modo de falha está desativado.${RESET}\n`);
process.exit(0);
