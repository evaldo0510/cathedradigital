/**
 * Sprint B.1 · Onda B.1.2 — Orquestrador da Busca Unificada.
 *
 * A UI conversa APENAS com `searchLibrary()`. O serviço:
 *   1. dispara searchers dos módulos-alvo em paralelo;
 *   2. enriquece com nexus (1 query batch);
 *   3. compõe o score final e ordena;
 *   4. devolve `LibraryResult[]` já pronto para o `LibraryCard`.
 */
import type { LibraryModule } from '../types';
import { LIBRARY_MODULE_META, LIBRARY_MODULE_ORDER } from './moduleMeta';
import { enrichWithNexus, type NexusSummary } from './nexusEnrich';
import { composeScore } from './ranking';
import { MODULE_SEARCHERS, type RawHit } from './searchers';
import type {
  LibraryResult,
  LibrarySearchOptions,
  LibrarySearchResponse,
} from './types';

const EMPTY_NEXUS: NexusSummary = { total: 0, byKind: {} };

export async function searchLibrary(
  options: LibrarySearchOptions,
): Promise<LibrarySearchResponse> {
  const started = performance.now();
  const query = options.query.trim();

  const emptyResponse = (): LibrarySearchResponse => ({
    query,
    results: [],
    countsByType: {},
    totalFound: 0,
    durationMs: 0,
  });

  if (query.length < 2) return emptyResponse();

  const targets: LibraryModule[] =
    !options.types || options.types === 'all' ? LIBRARY_MODULE_ORDER : options.types;
  const perModule = options.perModule ?? 6;

  const settled = await Promise.allSettled(
    targets.map((mod) => MODULE_SEARCHERS[mod](query, perModule)),
  );

  const hits: RawHit[] = [];
  settled.forEach((res, i) => {
    if (res.status === 'fulfilled') {
      hits.push(...res.value);
    } else if (import.meta.env.DEV) {
      console.warn(`[searchLibrary] módulo ${targets[i]} falhou`, res.reason);
    }
  });

  const nexusMap = options.withNexus !== false
    ? await enrichWithNexus(hits)
    : new Map<string, NexusSummary>();

  const results: LibraryResult[] = hits.map((hit) => {
    const meta = LIBRARY_MODULE_META[hit.type];
    const nexus = hit.nexusRef
      ? nexusMap.get(`${hit.nexusRef.kind}:${hit.nexusRef.ref}`) ?? EMPTY_NEXUS
      : EMPTY_NEXUS;
    const { score, textRelevance: t } = composeScore({
      query,
      module: hit.type,
      title: hit.title,
      excerpt: hit.excerpt,
      editorialStatus: hit.editorialStatus,
      nexusTotal: nexus.total,
    });
    return {
      type: hit.type,
      id: hit.id,
      title: hit.title,
      subtitle: hit.subtitle,
      excerpt: hit.excerpt,
      editorialStatus: hit.editorialStatus,
      href: hit.href,
      icon: meta.icon,
      nexus: nexus.total > 0 ? nexus : undefined,
      score,
      textRelevance: t,
    };
  });

  results.sort((a, b) => b.score - a.score);

  const countsByType: Partial<Record<LibraryModule, number>> = {};
  for (const r of results) countsByType[r.type] = (countsByType[r.type] ?? 0) + 1;

  return {
    query,
    results,
    countsByType,
    totalFound: results.length,
    durationMs: Math.round(performance.now() - started),
  };
}
