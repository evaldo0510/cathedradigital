/**
 * ContinuationEngine — orquestra o pipeline de decisão do próximo passo.
 *
 *   Reader → resolveContext → findCandidates → scoreCandidates
 *          → chooseSuggestions → (fallback se necessário) → Result
 *
 * Regras invioláveis (Sprint 2 revisada):
 *  - Knowledge Engine só devolve `ResolvedNode[]`. Nunca `Suggestion`.
 *  - ReaderContinuation nunca conversa com KnowledgeGraph diretamente.
 *  - Fallback editorial da Sprint 1 permanece como rede de segurança.
 *
 * FASE 0: o pipeline está esqueletado; `findCandidates` devolve `[]` de
 * forma controlada, então o Engine sempre cai no fallback. Zero regressão
 * frente ao comportamento anterior.
 */

import { resolveContext } from './resolveContext';
import { findCandidates } from './findCandidates';
import { scoreCandidates } from './scoreCandidates';
import { chooseSuggestions } from './chooseSuggestions';
import { fallbackSuggestions } from './fallback';
import type {
  ContinuationInput,
  ContinuationResult,
  ContinuationSuggestion,
} from './types';

const MIN_CONFIDENCE_TO_SKIP_FALLBACK: ContinuationSuggestion['confidence'] = 'medium';

function hasStrongSuggestion(list: ContinuationSuggestion[]): boolean {
  return list.some((s) =>
    s.confidence === 'high' || s.confidence === MIN_CONFIDENCE_TO_SKIP_FALLBACK,
  );
}

export const ContinuationEngine = {
  run(input: ContinuationInput): ContinuationResult {
    const context = resolveContext(input);

    const candidates = findCandidates(context);
    const scored = scoreCandidates(candidates);
    const fromGraph = chooseSuggestions(scored);

    if (hasStrongSuggestion(fromGraph)) {
      return {
        suggestions: fromGraph,
        source: 'graph',
        context,
      };
    }

    // Rede de segurança: fallback editorial da Sprint 1.
    const fallback = fallbackSuggestions(context);

    if (fromGraph.length === 0) {
      return { suggestions: fallback, source: 'fallback', context };
    }

    // Mistura: mantém o topo do grafo (mesmo com confiança baixa) e
    // complementa com fallback para nunca deixar o leitor sem opções.
    const merged: ContinuationSuggestion[] = [];
    const seenHref = new Set<string>();
    for (const s of [...fromGraph, ...fallback]) {
      if (seenHref.has(s.href)) continue;
      seenHref.add(s.href);
      merged.push(s);
      if (merged.length >= 3) break;
    }
    return { suggestions: merged, source: 'mixed', context };
  },
};
