/**
 * Barrel do Knowledge Engine.
 *
 * A API pública oficial (Sprint 2.0.4A+) é `KnowledgeGraph`.
 * As demais peças (Registry, Navigator, Resolver, Index, Collection)
 * permanecem exportadas por compatibilidade com a Sprint 2.0.4, mas
 * novos consumidores devem usar apenas o Graph.
 */

// --- API pública oficial ---
export { KnowledgeGraph } from './KnowledgeGraph';
export type {
  ComposedStudyStep,
  KnowledgeSearchOptions,
  KnowledgeCollectionDescriptor,
  KnowledgeCollectionId,
} from './KnowledgeGraph';

// --- Tipos do domínio ---
export * from './types';

// --- Convenção de IDs ---
export { buildId, parseId, isValidId, slugify, KNOWLEDGE_KINDS } from './ids';
export type { ParsedId } from './ids';

// --- Continuation (Sprint 2 — Continuidade Inteligente) ---
export { resolveContinuation } from './continuation';
export type {
  ContinuationContext,
  ContinuationIntent,
  ContinuationSuggestion,
} from './continuation';

// --- Internos (uso interno / compatibilidade — evitar em novos consumidores) ---
export { KnowledgeRegistry } from './KnowledgeRegistry';
export { KnowledgeNavigator, COMPOSED_STUDY_STAGES } from './KnowledgeNavigator';
export { KnowledgeResolver } from './KnowledgeResolver';
export { KnowledgeIndex } from './KnowledgeIndex';
export { KnowledgeCollectionRegistry } from './KnowledgeCollection';
