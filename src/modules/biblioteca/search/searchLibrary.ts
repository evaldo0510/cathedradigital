/**
 * Sprint B.1 · Onda B.1.4 — Orquestrador da Busca Unificada + Semântica.
 *
 * Fluxo:
 *   1. Dispara searchers lexicais dos módulos-alvo + adapter semântico
 *      (`getSemanticSearcher()`) em paralelo — `Promise.allSettled`.
 *   2. Enriquece hits lexicais com nexus (1 query batch).
 *   3. Sobrepõe `semanticScore` / `reason` / `matchedConcepts` nos itens
 *      que também aparecem no adapter semântico.
 *   4. Hidrata hits *órfãos* (só semânticos) rodando searchers específicos
 *      com o TÍTULO do conceito — mantém contrato `LibraryResult`.
 *   5. Compõe score híbrido (40/25/20/15) e ordena.
 *
 * Regra COS: MCP enriquece, MCP nunca controla. A UI conversa APENAS com
 * `searchLibrary()`.
 */
import type { LibraryModule } from '../types';
import { LIBRARY_MODULE_META, LIBRARY_MODULE_ORDER } from './moduleMeta';
import { enrichWithNexus, type NexusSummary } from './nexusEnrich';
import { composeHybridScore } from './ranking';
import { MODULE_SEARCHERS, type RawHit } from './searchers';
import { getSemanticSearcher, type SemanticHit } from './semantic/semanticClient';
import {
  applySemanticEnrichment,
  buildSemanticMap,
  pickOrphanHits,
} from './semantic/semanticMapper';
import { inferFormationLevel } from './semantic/semanticRanking';
import type {
  LibraryResult,
  LibrarySearchOptions,
  LibrarySearchResponse,
} from './types';

const EMPTY_NEXUS: NexusSummary = { total: 0, byKind: {} };

const keyOf = (kind: string, ref: string) => `${kind}:${ref}`;
const keyOfHit = (h: RawHit) =>
  h.nexusRef ? keyOf(h.nexusRef.kind, h.nexusRef.ref) : `${h.type}:${h.id}`;


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

  // 1. Lexical + semântico em paralelo (adapter é opcional).
  const lexicalPromise = Promise.allSettled(
    targets.map((mod) => MODULE_SEARCHERS[mod](query, perModule)),
  );
  const semanticPromise: Promise<SemanticHit[]> = getSemanticSearcher()
    .search({ query })
    .catch((err) => {
      if (import.meta.env.DEV) console.warn('[searchLibrary] semantic falhou', err);
      return [];
    });

  const [settled, semanticHits] = await Promise.all([lexicalPromise, semanticPromise]);

  const hits: RawHit[] = [];
  settled.forEach((res, i) => {
    if (res.status === 'fulfilled') {
      hits.push(...res.value);
    } else if (import.meta.env.DEV) {
      console.warn(`[searchLibrary] módulo ${targets[i]} falhou`, res.reason);
    }
  });

  const semanticMap = buildSemanticMap(semanticHits);
  const lexicalKeys = new Set(hits.map(keyOfHit));

  // 2. Hidratar hits semânticos órfãos (não vieram do lexical).
  //    Reaproveita o mesmo searcher do módulo alvo — nada de novo shape.
  const orphanBudget = Math.max(6, perModule);
  const orphans = pickOrphanHits(semanticHits, lexicalKeys, orphanBudget)
    .filter((h) => targets.includes(h.type));

  const orphanSettled = await Promise.allSettled(
    orphans.map((h) => MODULE_SEARCHERS[h.type](h.ref, 1)),
  );
  orphanSettled.forEach((res, i) => {
    if (res.status !== 'fulfilled') return;
    const orph = orphans[i];
    // Preserva match apenas quando o searcher devolveu o item exato buscado.
    for (const raw of res.value) {
      const k = keyOfHit(raw);
      if (k === keyOf(orph.kind, orph.ref) && !lexicalKeys.has(k)) {
        hits.push(raw);
        lexicalKeys.add(k);
      }
    }
  });

  // 3. Enriquecimento Nexus (1 batch bidirecional). Falha silenciosa.
  const nexusMap = options.withNexus !== false
    ? await enrichWithNexus(hits).catch(() => new Map<string, NexusSummary>())
    : new Map<string, NexusSummary>();

  // 4. Compor `LibraryResult` com score híbrido + campos AI.
  const results: LibraryResult[] = hits.map((hit) => {
    const meta = LIBRARY_MODULE_META[hit.type];
    const nexKey = hit.nexusRef ? keyOf(hit.nexusRef.kind, hit.nexusRef.ref) : undefined;
    const nexus = nexKey ? nexusMap.get(nexKey) ?? EMPTY_NEXUS : EMPTY_NEXUS;
    const semantic = nexKey ? semanticMap.get(nexKey) : undefined;
    const breakdown = composeHybridScore({
      query,
      module: hit.type,
      title: hit.title,
      excerpt: hit.excerpt,
      editorialStatus: hit.editorialStatus,
      nexusTotal: nexus.total,
      semanticScore: semantic?.semanticScore,
    });
    const base: LibraryResult = {
      type: hit.type,
      id: hit.id,
      title: hit.title,
      subtitle: hit.subtitle,
      excerpt: hit.excerpt,
      editorialStatus: hit.editorialStatus,
      href: hit.href,
      icon: meta.icon,
      nexus: nexus.total > 0 ? nexus : undefined,
      score: breakdown.score,
      textRelevance: breakdown.textRelevance,
    };
    const withSemantic = applySemanticEnrichment(base, semantic);
    return { ...withSemantic, formationLevel: inferFormationLevel(withSemantic) };
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

