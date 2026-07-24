#!/usr/bin/env tsx
/**
 * P0.3.2 · Headings Audit — Guardrail bloqueante do CI.
 *
 * Escaneia os arquivos de página (src/pages/**) e valida:
 *   1. Cada página tem exatamente 1 H1 (contando <h1> literal + <EditorialHero>).
 *   2. Nenhum salto de nível (H1→H3, H2→H4, H3→H5) na ordem de aparição.
 *   3. H1 não vazio.
 *
 * Heurística estática, não runtime: soma H1 do arquivo + H1 emitidos por
 * primitivos conhecidos que injetam H1 (hoje: EditorialHero).
 *
 * Falha com exit 1 se qualquer violação for detectada.
 */
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Componentes que injetam UM H1 quando renderizados.
const H1_EMITTING_PRIMITIVES = ['EditorialHero'];

// Arquivos ignorados: fixtures de teste, protótipos legados, componentes internos
// que não são páginas roteadas (auditados via arquivo raiz que os consome).
const IGNORE_PATTERNS = [
  /__tests?__/,
  /\.test\.[tj]sx?$/,
  /\.spec\.[tj]sx?$/,
  /pages\/prototype-2\.0\//,
  /pages\/__test\//,
  /pages\/landing\//,          // fragments compostos em Index.tsx
  /pages\/dev\//,              // showcase interno, fora de produção
  /pages\/NotFound\.tsx$/,     // 404 pode ter apenas H2
];

type Finding = {
  file: string;
  kind: 'missing_h1' | 'duplicate_h1' | 'skip' | 'empty_h1';
  detail: string;
};

const findings: Finding[] = [];

function auditFile(abs: string) {
  const rel = relative(ROOT, abs);
  if (IGNORE_PATTERNS.some((r) => r.test(rel))) return;

  const src = readFileSync(abs, 'utf8');

  // Coletar tags de heading + primitivos H1-emitters, na ordem de aparição.
  // Note: negative lookahead exclui subcomponentes tipo <EditorialHero.Title>.
  const tagRe = /<(h[1-6]|EditorialHero)(?![.\w])([^>]*)>/g;
  const headings: { level: number; index: number; empty: boolean; source: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(src))) {
    const tag = m[1];
    let level: number;
    let empty = false;
    if (tag === 'EditorialHero') {
      level = 1;
    } else {
      level = parseInt(tag.slice(1), 10);
      // Detecta H1 com children vazio: <h1 ...></h1> ou <h1 ... />
      const attrs = m[2];
      if (attrs.trim().endsWith('/')) empty = true;
      else {
        // Olha o próximo trecho do source até </hN>
        const closeRe = new RegExp(`</${tag}>`);
        const rest = src.slice(m.index + m[0].length);
        const closeMatch = closeRe.exec(rest);
        if (closeMatch) {
          const inner = rest.slice(0, closeMatch.index).trim();
          if (!inner) empty = true;
        }
      }
    }
    headings.push({ level, index: m.index, empty, source: tag });
  }

  if (headings.length === 0) return; // arquivo não emite heading — provável utilitário

  // Regra 1: exatamente 1 H1
  const h1s = headings.filter((h) => h.level === 1);
  if (h1s.length === 0) {
    findings.push({ file: rel, kind: 'missing_h1', detail: 'Nenhum H1 (nem EditorialHero) encontrado.' });
  } else if (h1s.length > 1) {
    findings.push({
      file: rel,
      kind: 'duplicate_h1',
      detail: `${h1s.length} H1s (sources: ${h1s.map((h) => h.source).join(', ')}).`,
    });
  }

  // Regra 3: H1 vazio
  for (const h of h1s) {
    if (h.empty && h.source === 'h1') {
      findings.push({ file: rel, kind: 'empty_h1', detail: 'H1 sem conteúdo textual.' });
    }
  }

  // Regra 2: sem saltos (nível N seguido de nível > N+1)
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1];
    const cur = headings[i];
    if (cur.level > prev.level + 1) {
      findings.push({
        file: rel,
        kind: 'skip',
        detail: `H${prev.level} → H${cur.level} (esperado H${prev.level + 1} ou menor).`,
      });
    }
  }
}

const files = globSync('src/pages/**/*.{tsx,jsx}', { cwd: ROOT })
  .map((p) => resolve(ROOT, p))
  // Exclui sub-componentes reutilizáveis colocados dentro de src/pages/**;
  // páginas de rota terminam em `Page.tsx`. Padrões como `*Panel.tsx`,
  // `*Card.tsx`, `*Section.tsx`, `*List.tsx` são presentacionais e não são
  // roteados diretamente — não devem exigir H1 próprio.
  .filter((f) => !/(Panel|Card|Section|List|Item|Row|Cell|Header|Footer|Sidebar|Widget|Chart|Skeleton|Placeholder|Modal|Dialog|Drawer|Popover|Tooltip|Menu|Toolbar|Nav|Provider|Context|Guard|Layout)\.(tsx|jsx)$/.test(f));
for (const f of files) auditFile(f);


const byKind = findings.reduce<Record<string, number>>((acc, f) => {
  acc[f.kind] = (acc[f.kind] ?? 0) + 1;
  return acc;
}, {});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('P0.3.2 · Headings Audit');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Pages audited:       ${files.length}`);
console.log(`Missing H1:          ${byKind.missing_h1 ?? 0}`);
console.log(`Duplicate H1:        ${byKind.duplicate_h1 ?? 0}`);
console.log(`Empty H1:            ${byKind.empty_h1 ?? 0}`);
console.log(`Hierarchy skips:     ${byKind.skip ?? 0}`);
console.log('');

if (findings.length === 0) {
  console.log('Status: ✅ CERTIFIED — 0 violações.');
  process.exit(0);
}

console.error('Status: ❌ violações encontradas:\n');
for (const f of findings) {
  console.error(`  · [${f.kind}] ${f.file}\n      ${f.detail}`);
}
console.error(`\n${findings.length} violação(ões). Bloqueando CI.`);
process.exit(1);
