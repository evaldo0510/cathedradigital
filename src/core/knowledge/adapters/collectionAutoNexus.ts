/**
 * collectionAutoNexus — sugestões automáticas ao final de uma coleção temática.
 *
 * Coleções são trilhas curadas: o nó próprio é registrado com a espécie
 * `journey` (não existe espécie `collection` no grafo, e semanticamente uma
 * coleção é uma trilha de leitura). Sem UI, sem fetch — apenas grafo.
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

export interface CollectionNexusInput {
  slug: string;
  title: string;
  themes?: string[] | null;
}

const BUCKETS: readonly ReaderNexusBucket[] = [
  'bible', 'catechism', 'saint', 'glossary', 'prayer', 'journey',
];

const CACHE_MAX = 32;
const cache = new Map<string, ReaderAutoNexusOutput>();

export function _fingerprintCollection(i: CollectionNexusInput): string {
  return [i.slug, (i.themes ?? []).join('|')].join('#');
}

export function clearCollectionAutoNexusCache(): void {
  cache.clear();
}

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

export function resolveCollectionAutoNexus(
  input: CollectionNexusInput,
): ReaderAutoNexusOutput {
  const key = _fingerprintCollection(input);
  const started = nowMs();
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    recordNexusMetric({ adapter: 'collection', hit: true, ms: nowMs() - started, key });
    return hit;
  }

  const selfId = ensureNode(KIND_SPECS.journey, input.slug, input.title);

  const queries = [input.title, ...(input.themes ?? [])].filter(
    (q): q is string => !!q && q.length >= 3,
  );

  const { byBucket, suggestions } = buildBucketedSuggestions({
    selfId,
    buckets: BUCKETS,
    refs: {},
    fallbackQueries: queries,
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
  recordNexusMetric({ adapter: 'collection', hit: false, ms: nowMs() - started, key });
  return result;
}

export const collectionReaderAutoNexus: ReaderAutoNexus<CollectionNexusInput> = {
  kind: 'collection',
  label: 'Coleção',
  buildSuggestions: resolveCollectionAutoNexus,
};
