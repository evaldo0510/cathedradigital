/**
 * catechismAutoNexus — sugestões automáticas ao final de um parágrafo do CIC.
 */

import { KIND_SPECS, ensureNode } from './glossaryAutoNexus';
import {
  BUCKET_LABEL,
  buildBucketedSuggestions,
  type ReaderAutoNexus,
  type ReaderAutoNexusOutput,
  type ReaderNexusBucket,
} from './ReaderAutoNexus';
import { recordNexusMetric } from './nexusMetrics';

export interface CatechismNexusInput {
  paragraph: number;
  /** Texto ou trecho curto do parágrafo (para busca semântica). */
  excerpt?: string | null;
}

// Ordem canônica do Catecismo (Sprint Nexus 2.0):
// bíblia → glossário → santos → padres → magistério → orações → jornadas
const BUCKETS: readonly ReaderNexusBucket[] = [
  'bible', 'glossary', 'saint', 'father', 'magisterium', 'prayer', 'journey',
];

const CACHE_MAX = 64;
const cache = new Map<string, ReaderAutoNexusOutput>();

export function _fingerprintCatechism(i: CatechismNexusInput): string {
  return `${i.paragraph}#${(i.excerpt ?? '').slice(0, 80)}`;
}

export function clearCatechismAutoNexusCache(): void { cache.clear(); }

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

export function resolveCatechismAutoNexus(input: CatechismNexusInput): ReaderAutoNexusOutput {
  const key = _fingerprintCatechism(input);
  const started = nowMs();
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    recordNexusMetric({ adapter: 'catechism', hit: true, ms: nowMs() - started, key });
    return hit;
  }

  const selfId = ensureNode(
    KIND_SPECS.catechism,
    String(input.paragraph),
    `CIC §${input.paragraph}`,
  );

  const { byBucket, suggestions } = buildBucketedSuggestions({
    selfId,
    buckets: BUCKETS,
    refs: {},
    fallbackQueries: [input.excerpt ?? '', `Catecismo ${input.paragraph}`],
  });

  const result: ReaderAutoNexusOutput = {
    selfId,
    suggestions,
    byBucket,
    labels: BUCKET_LABEL,
  };

  cache.set(key, result);
  if (cache.size > CACHE_MAX) {
    const first = cache.keys().next().value;
    if (first !== undefined) cache.delete(first);
  }
  recordNexusMetric({ adapter: 'catechism', hit: false, ms: nowMs() - started, key });
  return result;
}

export const catechismReaderAutoNexus: ReaderAutoNexus<CatechismNexusInput> = {
  kind: 'catechism',
  label: 'Catecismo',
  buildSuggestions: resolveCatechismAutoNexus,
};
