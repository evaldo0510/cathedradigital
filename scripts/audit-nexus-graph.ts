/**
 * STAB-NEXUS-P0 Etapa 3 — Auditoria automática do grafo × Nexus × App routes.
 *
 * Percorre SEED_NODES do Knowledge Engine, simula o resolveLink do Nexus
 * (mesma lógica de NexusBubbles.tsx) e valida cada URL contra as rotas
 * declaradas em src/App.tsx.
 *
 * Uso: bunx tsx scripts/audit-nexus-graph.ts
 * Saída: docs/CAT-030-NEXUS-COVERAGE.md
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { SEED_NODES } from '../src/core/knowledge/seed';

type Kind = string;

interface AuditRow {
  id: string;
  kind: Kind;
  label: string;
  resolvedUrl: string | null;
  routeMatched: string | null;
  status: 'ok' | 'no-route' | 'unmapped-in-app';
}

// Espelho de NexusBubbles.resolveLink — precisa manter paridade.
function resolveLink(node: {
  id: string;
  kind: string;
  routeParams?: Record<string, unknown>;
}): string | null {
  const meta = node.routeParams ?? {};
  switch (node.kind) {
    case 'bible': {
      const book = meta.book as string | undefined;
      const chapter = meta.chapter as number | undefined;
      if (book && chapter) {
        const verse = meta.verse ? `&verse=${meta.verse}` : '';
        return `/bible?book=${book}&ch=${chapter}${verse}`;
      }
      return null;
    }
    case 'catechism': {
      const p = (meta.paragraph ?? meta.number) as number | undefined;
      return p ? `/catechism?p=${p}` : null;
    }
    case 'magisterium': {
      const docId = (meta.doc ?? meta.document_id ?? meta.slug ?? node.id) as string;
      return docId ? `/magisterium/${docId}` : null;
    }
    case 'saint': {
      const ident = (meta.slug ?? meta.id ?? node.id) as string;
      return ident ? `/santos/${ident}` : null;
    }
    case 'theme': {
      const slug = (meta.slug ?? node.id) as string;
      return slug ? `/temas/${slug}` : null;
    }
    case 'journey':
      return node.id ? `/jornadas/${node.id}` : null;
    default:
      return null; // father, council, canon, application, prayer
  }
}

// Extrai path="..." de src/App.tsx.
function loadAppRoutes(): string[] {
  const src = readFileSync(resolve('src/App.tsx'), 'utf8');
  const routes = new Set<string>();
  const re = /path=["'`]([^"'`]+)["'`]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) routes.add(m[1]);
  return Array.from(routes);
}

// Casa URL contra padrão do App (`/santos/:id`).
function matchRoute(url: string, patterns: string[]): string | null {
  const path = url.split('?')[0];
  for (const p of patterns) {
    const re = new RegExp('^' + p.replace(/:[^/]+/g, '[^/]+').replace(/\*/g, '.*') + '$');
    if (re.test(path)) return p;
  }
  return null;
}

function main() {
  const routes = loadAppRoutes();
  const rows: AuditRow[] = SEED_NODES.map(n => {
    const url = resolveLink(n as any);
    const matched = url ? matchRoute(url, routes) : null;
    const status: AuditRow['status'] = !url
      ? 'no-route'
      : matched
        ? 'ok'
        : 'unmapped-in-app';
    return {
      id: n.id,
      kind: n.kind,
      label: n.label,
      resolvedUrl: url,
      routeMatched: matched,
      status,
    };
  });

  const byStatus = {
    ok: rows.filter(r => r.status === 'ok'),
    noRoute: rows.filter(r => r.status === 'no-route'),
    unmapped: rows.filter(r => r.status === 'unmapped-in-app'),
  };

  const total = rows.length;
  const pct = (n: number) => ((n / total) * 100).toFixed(1);

  const lines: string[] = [];
  lines.push('# CAT-030 — Cobertura Nexus × Grafo × Rotas\n');
  lines.push(`_Gerado por \`scripts/audit-nexus-graph.ts\` — ${new Date().toISOString()}_\n`);
  lines.push('## Sumário\n');
  lines.push(`- **Total de nós**: ${total}`);
  lines.push(`- **OK** (resolveLink + rota casada): ${byStatus.ok.length} (${pct(byStatus.ok.length)}%)`);
  lines.push(`- **Sem rota** (kind sem route pública — bubble ocultado): ${byStatus.noRoute.length} (${pct(byStatus.noRoute.length)}%)`);
  lines.push(`- **URL não mapeada em App.tsx** (P0 — investigar): ${byStatus.unmapped.length} (${pct(byStatus.unmapped.length)}%)\n`);

  const section = (title: string, items: AuditRow[]) => {
    if (items.length === 0) return;
    lines.push(`## ${title}\n`);
    lines.push('| Kind | Label | URL resolvida | Rota casada |');
    lines.push('|------|-------|---------------|-------------|');
    for (const r of items) {
      lines.push(`| \`${r.kind}\` | ${r.label} | ${r.resolvedUrl ?? '—'} | ${r.routeMatched ?? '—'} |`);
    }
    lines.push('');
  };

  section('❌ URL não mapeada em App.tsx', byStatus.unmapped);
  section('⚠️  Sem rota (bubble ocultado por design)', byStatus.noRoute);
  section('✅ OK', byStatus.ok);

  lines.push('## Rotas conhecidas em App.tsx\n');
  lines.push('```');
  lines.push(routes.sort().join('\n'));
  lines.push('```');

  mkdirSync('docs', { recursive: true });
  writeFileSync('docs/CAT-030-NEXUS-COVERAGE.md', lines.join('\n'));

  console.log(`[audit] ${total} nós — OK ${byStatus.ok.length} · sem-rota ${byStatus.noRoute.length} · unmapped ${byStatus.unmapped.length}`);
  console.log('[audit] Relatório: docs/CAT-030-NEXUS-COVERAGE.md');

  if (byStatus.unmapped.length > 0) process.exit(1);
}

main();
