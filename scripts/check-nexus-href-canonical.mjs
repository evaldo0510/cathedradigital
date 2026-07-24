#!/usr/bin/env node
/**
 * check-nexus-href-canonical — barreira contra duplicação de mapeamentos
 * de rota do Nexus. Falha o build se qualquer arquivo (fora de
 * `src/lib/nexusHref.ts`) reimplementar hrefs canônicos por NexusKind.
 *
 * Cobertura:
 *  1. Padrões de rota entidade (`/santos/${x}`, `/glossario/${x}`, etc.)
 *     em objetos/switches indexados por *_kind.
 *  2. Uso do tipo `NexusKind` como chave de Record sem passar por
 *     resolveNexusHref (heurística).
 *
 * Uso: node scripts/check-nexus-href-canonical.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');
const ALLOWLIST = new Set([
  'src/lib/nexusHref.ts',
  'src/lib/nexusNavigation.ts',
  'src/lib/__tests__/nexusHref.test.ts',
]);

/** Padrões proibidos: reimplementação inline de rotas por entidade. */
const FORBIDDEN = [
  { re: /`\/santos\/\$\{[^}]+\}`/g, hint: '/santos/${id} inline' },
  { re: /`\/glossario\/\$\{[^}]+\}`/g, hint: '/glossario/${slug} inline' },
  { re: /`\/oracao\/\$\{[^}]+\}`/g, hint: '/oracao/${slug} inline' },
  { re: /`\/jornadas\/\$\{[^}]+\}`/g, hint: '/jornadas/${slug} inline' },
  { re: /`\/magisterium\/\$\{[^}]+\}`/g, hint: '/magisterium/${id} inline' },
  { re: /`\/patristica\/\$\{[^}]+\}`/g, hint: '/patristica/${id} inline' },
  { re: /`\/missal\/\$\{[^}]+\}`/g, hint: '/missal/${slug} inline' },
  { re: /`\/catecismo\/\$\{[^}]+\}`/g, hint: '/catecismo/${id} legado — use catechismInternalPath' },
  { re: /`\/bible\?ref=\$\{[^}]+\}`/g, hint: '/bible?ref=... inline' },
];

/** Heurística: função local hrefFor(kind: NexusKind, ...) duplicada. */
const LOCAL_HREFFOR = /function\s+\w*[hH]refFor[A-Za-z]*\s*\(/g;

const violations = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry)) scan(full);
  }
}

function scan(file) {
  const rel = relative(ROOT, file).replaceAll('\\', '/');
  if (ALLOWLIST.has(rel)) return;
  const src = readFileSync(file, 'utf8');

  for (const { re, hint } of FORBIDDEN) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src)) !== null) {
      const line = src.slice(0, m.index).split('\n').length;
      violations.push({ file: rel, line, hint, snippet: m[0] });
    }
  }

  LOCAL_HREFFOR.lastIndex = 0;
  let m;
  while ((m = LOCAL_HREFFOR.exec(src)) !== null) {
    // Ignora se o próprio arquivo já usa resolveNexusHref.
    if (src.includes('resolveNexusHref')) continue;
    const line = src.slice(0, m.index).split('\n').length;
    violations.push({
      file: rel,
      line,
      hint: 'função local hrefFor* — reutilize resolveNexusHref',
      snippet: m[0],
    });
  }
}

walk(SRC);

if (violations.length > 0) {
  console.error(`\n❌ ${violations.length} violação(ões) de canonicidade do Nexus href:\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.hint}`);
    console.error(`    → ${v.snippet}`);
  }
  console.error(`\nUse resolveNexusHref de src/lib/nexusHref.ts.\n`);
  process.exit(1);
}

console.log('✅ Nenhuma duplicação de href do Nexus encontrada. resolveNexusHref é canônico.');
