/**
 * magisteriumAutoNexus — sugestões automáticas ao final de um documento
 * do Magistério.
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

export interface MagisteriumNexusInput {
  docId: string;
  title: string;
  themes?: string[] | null;
}

const BUCKETS: readonly ReaderNexusBucket[] = [
  'catechism', 'bible', 'glossary', 'journey', 'saint', 'prayer',
];

const CACHE_MAX = 64;
const cache = new Map<string, ReaderAutoNexusOutput>();

export function _fingerprintMagisterium(i: MagisteriumNexusInput): string {
  return [i.docId, i.title, (i.themes ?? []).join('|')].join('#');
}

export function clearMagisteriumAutoNexusCache(): void { cache.clear(); }

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

export function resolveMagisteriumAutoNexus(
  input: MagisteriumNexusInput,
): ReaderAutoNexusOutput {
  const key = _fingerprintMagisterium(input);
  const started = nowMs();
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    recordNexusMetric({ adapter: 'magisterium', hit: true, ms: nowMs() - started, key });
    return hit;
  }

  const selfId = ensureNode(KIND_SPECS.magisterium, input.docId, input.title);

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
  recordNexusMetric({ adapter: 'magisterium', hit: false, ms: nowMs() - started, key });
  return result;
}

export const magisteriumReaderAutoNexus: ReaderAutoNexus<MagisteriumNexusInput> = {
  kind: 'magisterium',
  label: 'Magistério',
  buildSuggestions: resolveMagisteriumAutoNexus,
};
