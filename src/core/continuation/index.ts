/**
 * Continuation Engine — barrel export.
 *
 * Regra de dependência (unidirecional):
 *   src/core/knowledge/    → NÃO importa nada daqui.
 *   src/core/continuation/ → pode consultar KnowledgeGraph (Fase 2+).
 *   src/components/**      → só conversa com este módulo.
 */

export { ContinuationEngine } from './ContinuationEngine';
export { resolveContext } from './resolveContext';
export { findCandidates } from './findCandidates';
export { scoreCandidates } from './scoreCandidates';
export { chooseSuggestions } from './chooseSuggestions';
export { fallbackSuggestions } from './fallback';
export {
  INTENT_EYEBROW,
  KIND_GRAPH_TITLE,
  KIND_FALLBACK_TITLE,
  KIND_EPIGRAPH,
} from './presets';
export { continuationTelemetry } from './telemetry';
export type {
  ContinuationKind,
  ContinuationIntent,
  ContinuationConfidence,
  ContinuationMeta,
  ContinuationInput,
  ContinuationContext,
  ContinuationCandidate,
  ScoredCandidate,
  ContinuationSuggestion,
  ContinuationResult,
} from './types';
