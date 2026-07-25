#!/usr/bin/env tsx
/**
 * P0.3.2 · Headings Audit — Guardrail bloqueante do CI.
 *
 * Escaneia os arquivos de página (src/pages/**) e valida:
 *   1. Cada página tem exatamente 1 H1 (contando <h1> literal + <EditorialHero>).
 *   2. Nenhum salto de nível (H1→H3, H2→H4, H3→H5) na ordem de aparição.
 *   3. H1 não vazio.
 *
 * Sub-componentes (Panel/Card/Section…) são auditados apenas para hierarquia,
 * não exigem H1 próprio — precisam de um `Page.tsx` pai que injete o H1.
 *
 * Falha com exit 1 se qualquer violação for detectada.
 */
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import { resolve, relative, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Componentes que injetam UM H1 quando renderizados.
export const H1_EMITTING_PRIMITIVES = ['EditorialHero'];

// Arquivos ignorados: fixtures de teste, protótipos legados, componentes internos
// que não são páginas roteadas (auditados via arquivo raiz que os consome).
export const IGNORE_PATTERNS = [
  /__tests?__/,
  /\.test\.[tj]sx?$/,
  /\.spec\.[tj]sx?$/,
  /pages\/prototype-2\.0\//,
  /pages\/__test\//,
  /pages\/landing\//,          // fragments compostos em Index.tsx
  /pages\/dev\//,              // showcase interno, fora de produção
  /pages\/NotFound\.tsx$/,     // 404 pode ter apenas H2
];

// Sub-componentes presentacionais dentro de src/pages/**: validam hierarquia
// mas não exigem H1. Devem ser consumidos por uma Page que injete o H1.
const SUBCOMPONENT_SUFFIX =
  /(Panel|Card|Section|List|Item|Row|Cell|Header|Footer|Sidebar|Widget|Chart|Skeleton|Placeholder|Modal|Dialog|Drawer|Popover|Tooltip|Menu|Toolbar|Nav|Provider|Context|Guard|Layout)\.(tsx|jsx)$/;

export type FindingKind = 'missing_h1' | 'duplicate_h1' | 'skip' | 'empty_h1';
export interface Finding {
  file: string;
  kind: FindingKind;
  detail: string;
  hint?: string;
}

interface HeadingHit {
  level: number;
  index: number;
  empty: boolean;
  source: string;
  text: string;
}

function extractHeadings(src: string): HeadingHit[] {
  // Negative lookahead exclui subcomponentes como <EditorialHero.Title>.
  const tagRe = /<(h[1-6]|EditorialHero)(?![.\w])([^>]*)>/g;
  const headings: HeadingHit[] = [];
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(src))) {
    const tag = m[1];
    let level: number;
    let empty = false;
    let text = '';
    if (tag === 'EditorialHero') {
      level = 1;
      // captura prop `title="..."` para citar no hint
      const attrs = m[2];
      const titleMatch = attrs.match(/title=\{?["'`]([^"'`}]+)["'`]\}?/);
      text = titleMatch?.[1] ?? '';
    } else {
      level = parseInt(tag.slice(1), 10);
      const attrs = m[2];
      if (attrs.trim().endsWith('/')) empty = true;
      else {
        const closeRe = new RegExp(`</${tag}>`);
        const rest = src.slice(m.index + m[0].length);
        const closeMatch = closeRe.exec(rest);
        if (closeMatch) {
          const inner = rest.slice(0, closeMatch.index).trim();
          if (!inner) empty = true;
          // primeira linha de texto legível (strip tags/braces)
          text = inner.replace(/<[^>]+>/g, '').replace(/\{[^}]+\}/g, '').trim().slice(0, 80);
        }
      }
    }
    headings.push({ level, index: m.index, empty, source: tag, text });
  }
  return headings;
}

export interface AuditOptions {
  /** Se true, arquivo é presentacional e não exige H1 próprio. */
  isSubcomponent?: boolean;
}

/**
 * Audita o código-fonte de um arquivo. Exposto para testes.
 */
export function auditSource(rel: string, src: string, opts: AuditOptions = {}): Finding[] {
  const findings: Finding[] = [];
  const headings = extractHeadings(src);
  if (headings.length === 0) return findings; // provável utilitário puro

  const h1s = headings.filter((h) => h.level === 1);
  const nonH1 = headings.filter((h) => h.level > 1);

  // Regra 1: exatamente 1 H1 (apenas para páginas roteadas)
  if (!opts.isSubcomponent) {
    if (h1s.length === 0) {
      // Hint acionável: aponta o primeiro heading não-H1 encontrado ou sugere EditorialHero.
      const firstH2 = nonH1.find((h) => h.level === 2);
      const hintParts: string[] = [];
      hintParts.push(
        `Envolva o topo da página com <EditorialHero title="…" /> ou promova o primeiro heading para <h1>.`,
      );
      if (firstH2) {
        hintParts.push(
          `Candidato mais provável: primeiro <h2> "${firstH2.text || '(sem texto)'}" — considere promovê-lo a H1 se for o título da página.`,
        );
      } else {
        hintParts.push(`Nenhum <h2> encontrado — a página parece não ter cabeçalho visível.`);
      }
      findings.push({
        file: rel,
        kind: 'missing_h1',
        detail: 'Nenhum H1 (nem <EditorialHero>) encontrado.',
        hint: hintParts.join(' '),
      });
    } else if (h1s.length > 1) {
      findings.push({
        file: rel,
        kind: 'duplicate_h1',
        detail: `${h1s.length} H1s (sources: ${h1s.map((h) => h.source).join(', ')}).`,
        hint: `Mantenha apenas um H1 por página. Rebaixe os demais para <h2>. Textos detectados: ${h1s
          .map((h) => `"${h.text || '(vazio)'}"`)
          .join(', ')}.`,
      });
    }

    for (const h of h1s) {
      if (h.empty && h.source === 'h1') {
        findings.push({
          file: rel,
          kind: 'empty_h1',
          detail: 'H1 sem conteúdo textual.',
          hint: 'Adicione um texto descritivo dentro do <h1>. H1 vazio quebra SEO e leitores de tela.',
        });
      }
    }
  }

  // Regra 2: sem saltos (nível N seguido de nível > N+1) — vale para todos.
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1];
    const cur = headings[i];
    if (cur.level > prev.level + 1) {
      findings.push({
        file: rel,
        kind: 'skip',
        detail: `H${prev.level} → H${cur.level} (esperado H${prev.level + 1} ou menor).`,
        hint: `Rebaixe "${cur.text || '(sem texto)'}" para H${prev.level + 1} ou adicione um heading intermediário.`,
      });
    }
  }

  return findings;
}

export function isSubcomponentFile(absPath: string): boolean {
  return SUBCOMPONENT_SUFFIX.test(basename(absPath));
}

// ─── CLI ────────────────────────────────────────────────────────────
function runCli(): number {
  const findings: Finding[] = [];
  const files = globSync('src/pages/**/*.{tsx,jsx}', { cwd: ROOT }).map((p) =>
    resolve(ROOT, p),
  );

  let audited = 0;
  for (const abs of files) {
    const rel = relative(ROOT, abs);
    if (IGNORE_PATTERNS.some((r) => r.test(rel))) continue;
    audited += 1;
    const src = readFileSync(abs, 'utf8');
    const isSub = isSubcomponentFile(abs);
    findings.push(...auditSource(rel, src, { isSubcomponent: isSub }));
  }

  const byKind = findings.reduce<Record<string, number>>((acc, f) => {
    acc[f.kind] = (acc[f.kind] ?? 0) + 1;
    return acc;
  }, {});

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('P0.3.2 · Headings Audit');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Pages audited:       ${audited}`);
  console.log(`Missing H1:          ${byKind.missing_h1 ?? 0}`);
  console.log(`Duplicate H1:        ${byKind.duplicate_h1 ?? 0}`);
  console.log(`Empty H1:            ${byKind.empty_h1 ?? 0}`);
  console.log(`Hierarchy skips:     ${byKind.skip ?? 0}`);
  console.log('');

  if (findings.length === 0) {
    console.log('Status: ✅ CERTIFIED — 0 violações.');
    return 0;
  }

  console.error('Status: ❌ violações encontradas:\n');
  for (const f of findings) {
    console.error(`  · [${f.kind}] ${f.file}`);
    console.error(`      ${f.detail}`);
    if (f.hint) console.error(`      💡 ${f.hint}`);
  }
  console.error(`\n${findings.length} violação(ões). Bloqueando CI.`);
  return 1;
}

// Executa apenas quando chamado como script (não como import de teste).
const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  process.exit(runCli());
}
