/**
 * Sprint B.1 · Onda B.1.4 — Semantic Mapper.
 *
 * Converte `SemanticHit[]` do adapter em um mapa `(kind:ref) → enriquecimento`
 * que o orquestrador aplica sobre `LibraryResult` lexical. O mapper NÃO cria
 * resultados novos por si só — quem faz isso é o `searchLibrary()`, que decide
 * quando hidratar hits puramente semânticos via searchers de módulo.
 */
import type { LibraryResult } from '../types';
import type { SemanticHit } from './semanticClient';

export interface SemanticEnrichment {
  semanticScore: number;
  reason: string;
  matchedConcepts: string[];
}

const keyOf = (kind: string, ref: string) => `${kind}:${ref}`;

/** Constrói mapa `nexusKey → enriquecimento` a partir dos hits semânticos. */
export function buildSemanticMap(hits: SemanticHit[]): Map<string, SemanticEnrichment> {
  const map = new Map<string, SemanticEnrichment>();
  for (const h of hits) {
    const k = keyOf(h.kind, h.ref);
    const prev = map.get(k);
    if (!prev || h.score > prev.semanticScore) {
      map.set(k, {
        semanticScore: h.score,
        reason: h.reason,
        matchedConcepts: h.matchedConcepts,
      });
    }
  }
  return map;
}

/** Copia os campos AI-ready sobre um `LibraryResult` sem tocar o restante. */
export function applySemanticEnrichment(
  result: LibraryResult,
  enrich: SemanticEnrichment | undefined,
): LibraryResult {
  if (!enrich) return result;
  return {
    ...result,
    semanticScore: enrich.semanticScore,
    reason: enrich.reason,
    matchedConcepts: enrich.matchedConcepts,
  };
}

/** Hits semânticos que ainda não têm um resultado lexical correspondente. */
export function pickOrphanHits(
  hits: SemanticHit[],
  lexicalKeys: Set<string>,
  limit: number,
): SemanticHit[] {
  const seen = new Set<string>();
  const out: SemanticHit[] = [];
  for (const h of hits) {
    const k = keyOf(h.kind, h.ref);
    if (lexicalKeys.has(k) || seen.has(k)) continue;
    seen.add(k);
    out.push(h);
    if (out.length >= limit) break;
  }
  return out;
}
