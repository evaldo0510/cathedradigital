/**
 * prayerAutoNexus — Nexus 100% automático para orações do Prayer Engine.
 *
 * Ao concluir uma oração, o ReaderContinuation exibe até 6 próximos passos
 * (Bíblia, Catecismo, Glossário, Jornada, Santo, Liturgia). Toda URL vem
 * de `KnowledgeResolver` → `RouteRegistry`. Nada hardcoded.
 *
 * Fontes de referência agregadas:
 *   - prayer.related_bible / related_catechism / related_saints / related_glossary
 *   - blocks[].refs?.bible / .catechism
 *   - fallback: KnowledgeGraph.search(prayer.title)
 */

import { KnowledgeGraph } from '../KnowledgeGraph';
import { KnowledgeRegistry } from '../KnowledgeRegistry';
import type { KnowledgeNodeId, ResolvedNode } from '../types';
import type { ContinuationSuggestion } from '../continuation';
import { KIND_SPECS, ensureNode } from './glossaryAutoNexus';
import { recordNexusMetric } from './nexusMetrics';

/* --------------------- entradas agnósticas ao Supabase --------------------- */

export interface PrayerNexusInput {
  slug: string;
  title: string;
  category?: string | null;
  related_bible?: string[] | null;
  related_catechism?: Array<number | string> | null;
  related_saints?: string[] | null;
  related_glossary?: string[] | null;
  related_journeys?: string[] | null;
  related_liturgy?: string[] | null;
  block_refs?: Array<{ bible?: string[]; catechism?: number[] }> | null;
}

/* Ordem oficial dos buckets (define a ordem visual das sugestões). */
const BUCKETS = ['bible', 'catechism', 'glossary', 'journey', 'saint', 'liturgy'] as const;
type Bucket = (typeof BUCKETS)[number];

const BUCKET_EYEBROW: Record<Bucket, string> = {
  bible: 'Meditar na Escritura',
  catechism: 'Aprofundar no Catecismo',
  glossary: 'Estudar o verbete',
  journey: 'Continuar a formação',
  saint: 'Conhecer o santo',
  liturgy: 'Rezar com a Liturgia',
};

/* -------------------------------- cache LRU ------------------------------- */

const CACHE_MAX = 64;
const cache = new Map<string, PrayerAutoNexusResult>();

export function _fingerprintPrayer(p: PrayerNexusInput): string {
  const join = (xs: (string | number)[] | null | undefined) =>
    (xs ?? []).map(String).join('|');
  const blocks =
    (p.block_refs ?? [])
      .map((r) => `${(r.bible ?? []).join(',')}#${(r.catechism ?? []).join(',')}`)
      .join('§');
  return [
    p.slug,
    p.category ?? '',
    join(p.related_bible),
    join(p.related_catechism),
    join(p.related_saints),
    join(p.related_glossary),
    join(p.related_journeys),
    join(p.related_liturgy),
    blocks,
  ].join('#');
}

export function clearPrayerAutoNexusCache(): void {
  cache.clear();
}

/* -------------------------------- resultado ------------------------------- */

export interface PrayerAutoNexusResult {
  /** Nó do próprio orador no grafo (para telemetria/afinidade). */
  selfId: KnowledgeNodeId | null;
  /** Sugestões prontas para o ReaderContinuation. */
  suggestions: ContinuationSuggestion[];
  /** Nós resolvidos por bucket (para diagnósticos/UI opcional). */
  byBucket: Record<Bucket, ResolvedNode[]>;
  /** Rótulos por nodeId — exigido pelo contrato ReaderAutoNexusOutput. */
  labels: Record<string, string>;
}


function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

/* -------------------------------- helpers --------------------------------- */

function collectRefs(p: PrayerNexusInput): Record<Bucket, string[]> {
  const out: Record<Bucket, string[]> = {
    bible: [], catechism: [], glossary: [], journey: [], saint: [], liturgy: [],
  };
  const pushUnique = (bucket: Bucket, raw: string) => {
    const v = raw.trim();
    if (!v) return;
    if (!out[bucket].includes(v)) out[bucket].push(v);
  };

  (p.related_bible ?? []).forEach((r) => pushUnique('bible', r));
  (p.related_catechism ?? []).forEach((r) => pushUnique('catechism', String(r)));
  (p.related_glossary ?? []).forEach((r) => pushUnique('glossary', r));
  (p.related_journeys ?? []).forEach((r) => pushUnique('journey', r));
  (p.related_saints ?? []).forEach((r) => pushUnique('saint', r));
  (p.related_liturgy ?? []).forEach((r) => pushUnique('liturgy', r));

  for (const br of p.block_refs ?? []) {
    (br.bible ?? []).forEach((r) => pushUnique('bible', r));
    (br.catechism ?? []).forEach((n) => pushUnique('catechism', String(n)));
  }
  return out;
}

/* ----------------------------- core resolver ------------------------------ */

export function resolvePrayerAutoNexus(input: PrayerNexusInput): PrayerAutoNexusResult {
  const key = _fingerprintPrayer(input);
  const started = nowMs();
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    recordNexusMetric({ adapter: 'prayer', hit: true, ms: nowMs() - started, key });
    return hit;
  }

  // 1. Registra o próprio orador (idempotente).
  const selfId = ensureNode(KIND_SPECS.prayer, input.slug, input.title);

  // 2. Coleta refs por bucket.
  const refs = collectRefs(input);

  const byBucket: Record<Bucket, ResolvedNode[]> = {
    bible: [], catechism: [], glossary: [], journey: [], saint: [], liturgy: [],
  };

  for (const bucket of BUCKETS) {
    const spec = KIND_SPECS[bucket];
    for (const raw of refs[bucket]) {
      const id = ensureNode(spec, raw);
      if (!id) continue;
      const resolved = KnowledgeGraph.resolve(id);
      if (resolved?.url && !byBucket[bucket].some((r) => r.node.id === id)) {
        byBucket[bucket].push(resolved);
      }
    }
  }

  // 3. Fallback: busca por título/categoria para preencher buckets vazios
  //    com vizinhança semântica do grafo — sem inventar URL.
  const emptyBuckets = BUCKETS.filter((b) => byBucket[b].length === 0);
  if (emptyBuckets.length > 0) {
    const queries = [input.title, input.category ?? ''].filter((q) => q && q.length >= 3);
    const seen = new Set<KnowledgeNodeId>();
    for (const q of queries) {
      const found = KnowledgeGraph.search(q, { limit: 24 });
      for (const n of found) {
        if (seen.has(n.id) || n.id === selfId) continue;
        seen.add(n.id);
        const bucket = (BUCKETS as readonly string[]).includes(n.kind)
          ? (n.kind as Bucket)
          : null;
        if (!bucket || byBucket[bucket].length > 0) continue;
        const resolved = KnowledgeGraph.resolve(n.id);
        if (resolved?.url) byBucket[bucket].push(resolved);
      }
    }
  }

  // 4. Ainda vazio? Neighbors do próprio nó (se houver arestas).
  if (selfId && KnowledgeRegistry.hasNode(selfId)) {
    KnowledgeGraph.neighbors(selfId).forEach((n) => {
      const bucket = (BUCKETS as readonly string[]).includes(n.kind)
        ? (n.kind as Bucket)
        : null;
      if (!bucket || byBucket[bucket].length > 0) return;
      const resolved = KnowledgeGraph.resolve(n.id);
      if (resolved?.url) byBucket[bucket].push(resolved);
    });
  }

  // 5. Monta a lista final na ordem oficial (1 sugestão por bucket).
  const suggestions: ContinuationSuggestion[] = [];
  for (const bucket of BUCKETS) {
    const first = byBucket[bucket][0];
    if (!first || !first.url) continue;
    suggestions.push({
      intent: intentFor(bucket),
      eyebrow: BUCKET_EYEBROW[bucket],
      label: first.node.label,
      target: first,
      weight: 1,
    });
  }

  const labels: Record<string, string> = {};
  for (const bucket of BUCKETS) {
    for (const rn of byBucket[bucket]) labels[rn.node.id] = rn.node.label;
  }

  const result: PrayerAutoNexusResult = { selfId, suggestions, byBucket, labels };

  cache.set(key, result);
  if (cache.size > CACHE_MAX) {
    const first = cache.keys().next().value;
    if (first !== undefined) cache.delete(first);
  }
  recordNexusMetric({ adapter: 'prayer', hit: false, ms: nowMs() - started, key });
  return result;
}

function intentFor(bucket: Bucket): ContinuationSuggestion['intent'] {
  switch (bucket) {
    case 'bible': return 'study';
    case 'catechism': return 'deepen';
    case 'glossary': return 'study';
    case 'journey': return 'apply';
    case 'saint': return 'meet';
    case 'liturgy': return 'pray';
  }
}
