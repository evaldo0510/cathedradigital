/**
 * saintAutoNexus — sugestões automáticas ao final de uma ficha de santo.
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

export interface SaintNexusInput {
  slug: string;
  name: string;
  virtues?: string[] | null;
  themes?: string[] | null;
}

const BUCKETS: readonly ReaderNexusBucket[] = [
  'prayer', 'bible', 'glossary', 'journey', 'catechism', 'liturgy',
];

const CACHE_MAX = 64;
const cache = new Map<string, ReaderAutoNexusOutput>();

export function _fingerprintSaint(i: SaintNexusInput): string {
  return [i.slug, (i.virtues ?? []).join('|'), (i.themes ?? []).join('|')].join('#');
}

export function clearSaintAutoNexusCache(): void { cache.clear(); }

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

export function resolveSaintAutoNexus(input: SaintNexusInput): ReaderAutoNexusOutput {
  const key = _fingerprintSaint(input);
  const started = nowMs();
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    recordNexusMetric({ adapter: 'saint', hit: true, ms: nowMs() - started, key });
    return hit;
  }

  const selfId = ensureNode(KIND_SPECS.saint, input.slug, input.name);

  const queries = [input.name, ...(input.virtues ?? []), ...(input.themes ?? [])]
    .filter((q): q is string => !!q && q.length >= 3);

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
  recordNexusMetric({ adapter: 'saint', hit: false, ms: nowMs() - started, key });
  return result;
}

export const saintReaderAutoNexus: ReaderAutoNexus<SaintNexusInput> = {
  kind: 'saint',
  label: 'Santo',
  buildSuggestions: resolveSaintAutoNexus,
};
