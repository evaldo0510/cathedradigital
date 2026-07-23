/**
 * Auditoria: valida que todos os links internos do rodapé público
 * (src/config/footer-links.ts) correspondem a rotas reais registradas
 * em src/App.tsx e a entradas de metadados em src/config/routeMeta.ts.
 *
 * Também verifica que nenhum link do rodapé aponta para rotas com
 * `noindex: true` no ROUTE_META (Admin é a exceção legítima) e que
 * links externos usam URL absoluta (https://).
 *
 * Falha o build em qualquer divergência.
 *
 * Consumido por: .github/workflows/seo-and-tests.yml
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  PUBLIC_FOOTER_LINKS,
  CONDITIONAL_FOOTER_LINKS,
  EXTERNAL_FOOTER_LINKS,
  type FooterLink,
} from '../src/config/footer-links';
import { ROUTE_META } from '../src/config/routeMeta';

const APP_TSX = readFileSync(resolve('src/App.tsx'), 'utf8');

/** Extrai `path="..."` de <Route path="..." ...> em App.tsx. */
function extractRoutes(source: string): Set<string> {
  const routes = new Set<string>();
  const re = /<Route\s+path=["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    routes.add(m[1]);
  }
  return routes;
}

const REGISTERED_ROUTES = extractRoutes(APP_TSX);

interface Issue {
  level: 'error' | 'warn';
  link: FooterLink;
  message: string;
}
const issues: Issue[] = [];

function auditInternal(link: FooterLink, bucket: string) {
  if (!link.path) return;
  if (!link.path.startsWith('/')) {
    issues.push({ level: 'error', link, message: `[${bucket}] path deve começar com "/": ${link.path}` });
    return;
  }
  if (!REGISTERED_ROUTES.has(link.path)) {
    issues.push({
      level: 'error',
      link,
      message: `[${bucket}] rota "${link.path}" não está registrada em src/App.tsx (link "${link.label}")`,
    });
  }
  const meta = ROUTE_META[link.path];
  if (!meta) {
    issues.push({
      level: 'error',
      link,
      message: `[${bucket}] rota "${link.path}" não tem metadata em src/config/routeMeta.ts (link "${link.label}")`,
    });
    return;
  }
  // Admin é a única exceção legítima que pode ter noindex.
  if (meta.noindex && !link.adminOnly) {
    issues.push({
      level: 'error',
      link,
      message: `[${bucket}] link público "${link.label}" aponta para rota noindex "${link.path}"`,
    });
  }
  if (!meta.title || !meta.description) {
    issues.push({
      level: 'warn',
      link,
      message: `[${bucket}] rota "${link.path}" com metadata incompleta (title/description)`,
    });
  }
}

function auditExternal(link: FooterLink, bucket: string) {
  if (!link.href) return;
  try {
    const url = new URL(link.href);
    if (url.protocol !== 'https:') {
      issues.push({ level: 'error', link, message: `[${bucket}] link externo "${link.label}" não usa https://` });
    }
  } catch {
    issues.push({ level: 'error', link, message: `[${bucket}] href inválido em "${link.label}": ${link.href}` });
  }
  if (link.external !== true) {
    issues.push({ level: 'warn', link, message: `[${bucket}] link externo "${link.label}" deveria ter external: true` });
  }
}

function auditBucket(links: FooterLink[], bucket: string) {
  const seen = new Set<string>();
  for (const link of links) {
    const key = `${link.label}::${link.path ?? link.href ?? ''}`;
    if (seen.has(key)) {
      issues.push({ level: 'error', link, message: `[${bucket}] link duplicado: "${link.label}"` });
    }
    seen.add(key);
    if (link.path) auditInternal(link, bucket);
    if (link.href) auditExternal(link, bucket);
    if (!link.path && !link.href) {
      issues.push({ level: 'error', link, message: `[${bucket}] link "${link.label}" sem path nem href` });
    }
  }
}

auditBucket(PUBLIC_FOOTER_LINKS, 'PUBLIC');
auditBucket(CONDITIONAL_FOOTER_LINKS, 'CONDITIONAL');
auditBucket(EXTERNAL_FOOTER_LINKS, 'EXTERNAL');

const errors = issues.filter((i) => i.level === 'error');
const warns = issues.filter((i) => i.level === 'warn');

console.log(`\n🔍 Footer link audit`);
console.log(`   Rotas registradas em App.tsx: ${REGISTERED_ROUTES.size}`);
console.log(`   Links auditados: ${PUBLIC_FOOTER_LINKS.length + CONDITIONAL_FOOTER_LINKS.length + EXTERNAL_FOOTER_LINKS.length}`);
console.log(`   Erros: ${errors.length}   Avisos: ${warns.length}\n`);

for (const w of warns) console.warn(`⚠️  ${w.message}`);
for (const e of errors) console.error(`❌ ${e.message}`);

if (errors.length > 0) {
  console.error(`\n💥 Auditoria de rodapé falhou (${errors.length} erro(s)). Corrija footer-links.ts, App.tsx ou routeMeta.ts.`);
  process.exit(1);
}
console.log('✅ Todos os links do rodapé correspondem a rotas + metadata válidas.');
