/**
 * audit-glossary-hardcoded — falha o build se houver rotas ou ids hardcoded
 * para conexões teológicas dentro do GlossaryTermPage ou dos adapters.
 *
 * Regra: toda ligação entre verbetes e Bíblia/Catecismo/Magistério/Santos/
 * Padres/Liturgia/Orações/Jornadas DEVE passar pelo KnowledgeGraph. Nenhum
 * literal `/biblia/...`, `/catecismo/...`, `to="/santos/..."` pode aparecer
 * na UI do verbete nem nos adapters. Apenas rotas AUTO-resolvidas via
 * `KnowledgeResolver` (que lê o `RouteRegistry`) são aceitas.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TARGETS = [
  'src/pages/GlossaryTermPage.tsx',
  'src/core/knowledge/adapters/glossaryAutoNexus.ts',
];

/**
 * Padrões proibidos — cross-refs para outros módulos como literais de rota
 * ou como slugs concatenados em strings.
 */
const FORBIDDEN_PATTERNS: Array<{ re: RegExp; name: string }> = [
  { re: /["'`]\/biblia\/[^"'`]/g, name: 'rota /biblia/... hardcoded' },
  { re: /["'`]\/catecismo\/[^"'`]/g, name: 'rota /catecismo/... hardcoded' },
  { re: /["'`]\/catechism\/[^"'`]/g, name: 'rota /catechism/... hardcoded' },
  { re: /["'`]\/santos\/[^"'`]/g, name: 'rota /santos/... hardcoded' },
  { re: /["'`]\/papas\/[^"'`]/g, name: 'rota /papas/... hardcoded' },
  { re: /["'`]\/padres\/[^"'`]/g, name: 'rota /padres/... hardcoded' },
  { re: /["'`]\/liturgia\/[^"'`]/g, name: 'rota /liturgia/... hardcoded' },
  { re: /["'`]\/oracao\/[^"'`]/g, name: 'rota /oracao/... hardcoded' },
  { re: /["'`]\/oracoes\/[^"'`]/g, name: 'rota /oracoes/... hardcoded' },
  { re: /["'`]\/magisterio\/[^"'`]/g, name: 'rota /magisterio/... hardcoded' },
  { re: /["'`]\/formacao\/[^"'`]/g, name: 'rota /formacao/... hardcoded' },
  { re: /["'`]\/jornadas\/[a-zA-Z0-9][^"'`]*["'`]/g, name: 'rota /jornadas/... hardcoded' },
  { re: /resolveNexusHref\s*\(/g, name: 'função resolveNexusHref (removida — usar KnowledgeGraph)' },
  { re: /NEXUS_KIND_LABEL\b/g, name: 'mapa NEXUS_KIND_LABEL (removido — usar labels do adapter)' },
];

/**
 * Auto-referências permitidas (não são cross-refs). Removemos essas ocorrências
 * antes de rodar a checagem para evitar falso positivo.
 */
const SELF_REF_ALLOWLIST: RegExp[] = [
  /["'`]\/glossario["'`]/g,               // link do breadcrumb
  /\/glossario\/\$\{term\.slug\}/g,       // canonical/URL do próprio verbete
  /\/glossario\/\$\{[^}]+\.slug\}/g,      // idem em template literal
];

interface Finding {
  file: string;
  line: number;
  pattern: string;
  snippet: string;
}

const findings: Finding[] = [];

for (const rel of TARGETS) {
  const abs = resolve(process.cwd(), rel);
  let raw: string;
  try {
    raw = readFileSync(abs, 'utf8');
  } catch (err) {
    console.error(`❌ Não foi possível ler ${rel}: ${(err as Error).message}`);
    process.exitCode = 2;
    continue;
  }

  // Neutraliza auto-refs antes da varredura.
  let src = raw;
  for (const allow of SELF_REF_ALLOWLIST) {
    src = src.replace(allow, '"__allowlisted_self_ref__"');
  }

  const lines = src.split('\n');
  for (const { re, name } of FORBIDDEN_PATTERNS) {
    lines.forEach((line, i) => {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(line)) !== null) {
        findings.push({
          file: rel,
          line: i + 1,
          pattern: name,
          snippet: line.trim().slice(0, 160),
        });
        if (!re.global) break;
      }
    });
  }
}

if (findings.length === 0) {
  console.log('✅ Auditoria OK — nenhuma relação hardcoded em GlossaryTermPage nem nos adapters.');
  console.log(`   Arquivos verificados: ${TARGETS.length}`);
  process.exit(0);
}

console.error('❌ Auditoria falhou — encontradas conexões hardcoded que deveriam passar pelo KnowledgeGraph:');
for (const f of findings) {
  console.error(`   • ${f.file}:${f.line}  [${f.pattern}]`);
  console.error(`       ${f.snippet}`);
}
console.error(`\nTotal: ${findings.length} ocorrência(s) em ${new Set(findings.map((f) => f.file)).size} arquivo(s).`);
console.error('Use `resolveAutoNexus(term)` + KnowledgeGraph em vez de literais de rota.');
process.exit(1);
