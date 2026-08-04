/**
 * extract-routes.mjs — extrai a tabela canônica de rotas de src/App.tsx.
 *
 * Saída: JSON em stdout (ou --out <arquivo>) com os padrões de rota já
 * resolvidos, incluindo rotas aninhadas (ex.: /conta + perfil → /conta/perfil).
 *
 * Usado pela Auditoria Global de Navegação (scripts/qa/nav-audit.py) para
 * decidir se um href encontrado na UI corresponde a uma rota registrada.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = 'src/App.tsx';

export function extractRoutes(source) {
  const lines = source.split('\n');
  const routes = [];
  /** pilha de prefixos de rotas-pai abertas (<Route path="x" ...> sem /> ) */
  const stack = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line.startsWith('<Route') && !line.startsWith('</Route')) continue;

    if (line.startsWith('</Route')) {
      stack.pop();
      continue;
    }

    const m = line.match(/path="([^"]*)"/);
    const selfClosing = line.endsWith('/>');
    const prefix = stack.join('');

    if (!m) {
      // <Route element={...}> sem path (layout puro) — só abre escopo.
      if (!selfClosing) stack.push(prefix ? '' : '');
      continue;
    }

    const path = m[1];
    const full = path.startsWith('/')
      ? path
      : `${prefix.replace(/\/$/, '')}/${path}`;

    routes.push(full);
    if (!selfClosing) stack.push(full);
  }

  return [...new Set(routes)].sort();
}

/** Converte um padrão de rota (`/santos/:id`) em RegExp. */
export function routeToRegex(pattern) {
  if (pattern === '*') return /^.*$/;
  const body = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/:[a-zA-Z_]+/g, '[^/]+')
    .replace(/\*/g, '.*');
  return new RegExp(`^${body}/?$`);
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const routes = extractRoutes(readFileSync(SRC, 'utf8'));
  const json = JSON.stringify({ source: SRC, count: routes.length, routes }, null, 2);
  const outIdx = process.argv.indexOf('--out');
  if (outIdx > -1 && process.argv[outIdx + 1]) {
    writeFileSync(process.argv[outIdx + 1], json);
    console.log(`${routes.length} rotas → ${process.argv[outIdx + 1]}`);
  } else {
    console.log(json);
  }
}
