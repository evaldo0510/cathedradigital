/**
 * mysteryAutoNexus — Adapter Nexus por mistério do Rosário.
 *
 * Reader Architecture Rule (COS §10). Substitui integralmente o
 * componente legado `MysteryNexusPanel`. O adapter apenas transforma
 * `DBMystery.meta` em `ReaderAutoNexusOutput`; a renderização fica
 * a cargo do `NexusPanel` canônico.
 *
 * Sem UI, sem fetch, sem URL hardcoded — toda resolução vai pelo
 * `KnowledgeGraph`.
 */

import { KnowledgeGraph } from '../KnowledgeGraph';
import type { ResolvedNode } from '../types';
import type {
  ReaderAutoNexusOutput,
  ReaderNexusBucket,
} from './ReaderAutoNexus';
import { KIND_SPECS, ensureNode } from './glossaryAutoNexus';
import { recordNexusMetric } from './nexusMetrics';
import type { DBMystery } from '@/prayer-engine/loadPrayerHierarchy';
import { readMysteryMeta } from '@/components/prayer/rosary/mysteryMeta';

/* Buckets projetados por um mistério (ordem canônica). */
const BUCKETS = ['bible', 'catechism', 'saint', 'glossary', 'magisterium', 'father'] as const;

type Bucket = (typeof BUCKETS)[number];

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

const cache = new Map<string, ReaderAutoNexusOutput>();
const CACHE_MAX = 64;

export function _fingerprintMystery(m: DBMystery): string {
  return `${m.id}:${(m as { updated_at?: string }).updated_at ?? ''}`;
}

export function clearMysteryAutoNexusCache(): void {
  cache.clear();
}

export function resolveMysteryAutoNexus(mystery: DBMystery): ReaderAutoNexusOutput {
  const key = _fingerprintMystery(mystery);
  const started = nowMs();
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    recordNexusMetric({ adapter: 'mystery', hit: true, ms: nowMs() - started, key });
    return hit;
  }

  const meta = readMysteryMeta(mystery);
  const byBucket: Partial<Record<ReaderNexusBucket, ResolvedNode[]>> = {};

  const pushNode = (bucket: Bucket, raw: string, label?: string) => {
    const spec = KIND_SPECS[bucket as keyof typeof KIND_SPECS];
    if (!spec) return;
    const id = ensureNode(spec, raw, label);
    if (!id) return;
    const resolved = KnowledgeGraph.resolve(id);
    if (!resolved?.url) return;
    const list = (byBucket[bucket] ??= []);
    if (!list.some((r) => r.node.id === id)) list.push(resolved);
  };

  // Bíblia — passagem primária + paralelas.
  const gospel = meta.primary_passage?.ref ?? mystery.gospel_ref;
  if (gospel) pushNode('bible', gospel);
  (meta.complementary_passages ?? []).forEach((ref) => pushNode('bible', ref));

  // Catecismo — referências completas + legado.
  const catechismList =
    meta.catechism_refs ?? (meta.catechism_ref ? [meta.catechism_ref] : []);
  for (const c of catechismList) pushNode('catechism', String(c.paragraph));

  // Santos relacionados.
  (meta.related_saints ?? []).forEach((s) =>
    pushNode('saint', s.slug ?? s.name, s.name),
  );

  // Padres da Igreja → bucket `father`.
  const fathers = meta.church_fathers ?? (meta.patristic_ref ? [meta.patristic_ref] : []);
  for (const p of fathers) pushNode('father', p.author, p.author);

  // Magistério.
  for (const m of meta.magisterium_refs ?? []) {
    const raw = [m.author, m.document].filter(Boolean).join(' · ') || m.document;
    if (raw) pushNode('magisterium', raw, m.document);
  }

  const labels: Record<string, string> = {};
  for (const bucket of BUCKETS) {
    for (const rn of byBucket[bucket] ?? []) labels[rn.node.id] = rn.node.label;
  }

  const out: ReaderAutoNexusOutput = {
    selfId: null,
    suggestions: [],
    byBucket,
    labels,
  };

  cache.set(key, out);
  if (cache.size > CACHE_MAX) {
    const first = cache.keys().next().value;
    if (first !== undefined) cache.delete(first);
  }
  recordNexusMetric({ adapter: 'mystery', hit: false, ms: nowMs() - started, key });
  return out;
}
