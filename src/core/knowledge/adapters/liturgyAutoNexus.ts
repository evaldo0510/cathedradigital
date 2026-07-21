/**
 * liturgyAutoNexus — sugestões automáticas para conteúdo litúrgico
 * (celebrações, tempos, ofícios). Ainda sem refs explícitas: opera
 * majoritariamente por busca semântica.
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

export interface LiturgyNexusInput {
  ref: string;
  title: string;
  season?: string | null;
}

const BUCKETS: readonly ReaderNexusBucket[] = [
  'bible', 'prayer', 'saint', 'catechism', 'glossary', 'journey',
];

const CACHE_MAX = 64;
const cache = new Map<string, ReaderAutoNexusOutput>();

export function _fingerprintLiturgy(i: LiturgyNexusInput): string {
  return [i.ref, i.title, i.season ?? ''].join('#');
}

export function clearLiturgyAutoNexusCache(): void { cache.clear(); }

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

export function resolveLiturgyAutoNexus(input: LiturgyNexusInput): ReaderAutoNexusOutput {
  const key = _fingerprintLiturgy(input);
  const started = nowMs();
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    recordNexusMetric({ adapter: 'liturgy', hit: true, ms: nowMs() - started, key });
    return hit;
  }

  const selfId = ensureNode(KIND_SPECS.liturgy, input.ref, input.title);

  const queries = [input.title, input.season ?? ''].filter(
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
  recordNexusMetric({ adapter: 'liturgy', hit: false, ms: nowMs() - started, key });
  return result;
}

export const liturgyReaderAutoNexus: ReaderAutoNexus<LiturgyNexusInput> = {
  kind: 'liturgy',
  label: 'Liturgia',
  buildSuggestions: resolveLiturgyAutoNexus,
};
