/**
 * journeyAutoNexus — Nexus 100% automático para Jornadas.
 *
 * Sem hardcode de rotas: usa `KnowledgeGraph.search()` sobre termos derivados
 * do próprio conteúdo da jornada (título, subtítulo, categoria, tags) e agrupa
 * os resultados por `kind`. Toda URL vem de `KnowledgeResolver`/`RouteRegistry`.
 */

import { KnowledgeGraph } from '../KnowledgeGraph';
import type { KnowledgeNodeId, ResolvedNode } from '../types';
import { recordNexusMetric } from './nexusMetrics';

export interface JourneyLike {
  id: string;
  title: string;
  subtitle?: string | null;
  category?: string | null;
  tags?: string[] | null;
}

const KIND_LABELS: Record<string, string> = {
  bible: 'Escritura',
  catechism: 'Catecismo',
  magisterium: 'Magistério',
  saint: 'Santos',
  father: 'Padres',
  liturgy: 'Liturgia',
  prayer: 'Orações',
  glossary: 'Glossário',
  journey: 'Jornadas',
};

const VISIBLE_KINDS = ['bible', 'catechism', 'saint', 'prayer', 'glossary'] as const;
export type JourneyNexusKind = (typeof VISIBLE_KINDS)[number];

export interface JourneyAutoNexusResult {
  byKind: Record<string, ResolvedNode[]>;
  labels: Record<string, string>;
  total: number;
}

/* ------------------------------ cache LRU ------------------------------ */

const CACHE_MAX = 64;
const cache = new Map<string, JourneyAutoNexusResult>();

/**
 * Fingerprint determinístico da jornada. Exportado para permitir cobertura
 * por testes unitários (`_fingerprintJourney`) e uso pelo `nexusMetrics`.
 */
export function _fingerprintJourney(j: JourneyLike): string {
  return [
    j.id,
    j.title ?? '',
    j.subtitle ?? '',
    j.category ?? '',
    (j.tags ?? []).join('|'),
  ].join('#');
}

export function clearJourneyAutoNexusCache(): void {
  cache.clear();
}

/* ------------------------------ core ---------------------------------- */

function dedupe(nodes: ResolvedNode[]): ResolvedNode[] {
  const seen = new Set<string>();
  const out: ResolvedNode[] = [];
  for (const r of nodes) {
    if (seen.has(r.node.id)) continue;
    seen.add(r.node.id);
    out.push(r);
  }
  return out;
}

function collectTerms(j: JourneyLike): string[] {
  const set = new Set<string>();
  const push = (s?: string | null) => {
    if (!s) return;
    const t = s.trim();
    if (t.length >= 3) set.add(t);
  };
  push(j.title);
  push(j.subtitle ?? undefined);
  push(j.category ?? undefined);
  (j.tags ?? []).forEach((t) => push(t));
  return Array.from(set);
}

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

export function resolveJourneyAutoNexus(journey: JourneyLike): JourneyAutoNexusResult {
  const key = _fingerprintJourney(journey);
  const started = nowMs();
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    recordNexusMetric({ adapter: 'journey', hit: true, ms: nowMs() - started, key });
    return hit;
  }

  const byKind: Record<string, ResolvedNode[]> = {};
  const seen = new Set<KnowledgeNodeId>();

  for (const term of collectTerms(journey)) {
    const nodes = KnowledgeGraph.search(term, { limit: 20 });
    for (const n of nodes) {
      if (seen.has(n.id)) continue;
      seen.add(n.id);
      const kindKey = (VISIBLE_KINDS as readonly string[]).includes(n.kind) ? n.kind : null;
      if (!kindKey) continue;
      const resolved = KnowledgeGraph.resolve(n.id);
      if (!resolved) continue;
      (byKind[kindKey] ??= []).push(resolved);
    }
  }

  for (const k of Object.keys(byKind)) byKind[k] = dedupe(byKind[k]).slice(0, 6);

  const total = Object.values(byKind).reduce((n, arr) => n + arr.length, 0);
  const result: JourneyAutoNexusResult = { byKind, labels: KIND_LABELS, total };

  cache.set(key, result);
  if (cache.size > CACHE_MAX) {
    const first = cache.keys().next().value;
    if (first !== undefined) cache.delete(first);
  }
  recordNexusMetric({ adapter: 'journey', hit: false, ms: nowMs() - started, key });
  return result;
}
