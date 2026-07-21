/**
 * bibleAutoNexus — sugestões automáticas ao final de um capítulo bíblico.
 * Segue o contrato ReaderAutoNexus.
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

export interface BibleNexusInput {
  bookAbbr: string;
  bookName: string;
  chapter: number;
}

const BUCKETS: readonly ReaderNexusBucket[] = [
  'catechism', 'glossary', 'prayer', 'saint', 'journey', 'liturgy',
];

const CACHE_MAX = 64;
const cache = new Map<string, ReaderAutoNexusOutput>();

export function _fingerprintBible(i: BibleNexusInput): string {
  return `${i.bookAbbr}#${i.chapter}`;
}

export function clearBibleAutoNexusCache(): void { cache.clear(); }

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

export function resolveBibleAutoNexus(input: BibleNexusInput): ReaderAutoNexusOutput {
  const key = _fingerprintBible(input);
  const started = nowMs();
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    recordNexusMetric({ adapter: 'bible', hit: true, ms: nowMs() - started, key });
    return hit;
  }

  const selfId = ensureNode(
    KIND_SPECS.bible,
    `${input.bookName} ${input.chapter}`,
    `${input.bookName} ${input.chapter}`,
  );

  const { byBucket, suggestions } = buildBucketedSuggestions({
    selfId,
    buckets: BUCKETS,
    refs: {},
    fallbackQueries: [input.bookName, `${input.bookName} ${input.chapter}`],
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
  recordNexusMetric({ adapter: 'bible', hit: false, ms: nowMs() - started, key });
  return result;
}

export const bibleReaderAutoNexus: ReaderAutoNexus<BibleNexusInput> = {
  kind: 'bible',
  label: 'Escritura',
  buildSuggestions: resolveBibleAutoNexus,
};
