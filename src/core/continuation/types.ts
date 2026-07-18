/**
 * Continuation Engine — contratos de domínio.
 *
 * Puro: sem React, sem Supabase, sem URLs literais, sem UI.
 * O Knowledge Engine NÃO conhece esses tipos; quem conversa com o grafo
 * é o Continuation Engine.
 */

import type {
  KnowledgeNodeId,
  KnowledgeNodeKind,
  ResolvedNode,
} from '@/core/knowledge/types';

/** Tipo de leitura em curso — origem do contexto. */
export type ContinuationKind =
  | 'bible'
  | 'catechism'
  | 'magisterium'
  | 'saint'
  | 'journey-step';

/**
 * Intenção espiritual/pedagógica de cada sugestão.
 * Sprint 2 (revisada): adiciona `celebrate` para tempo/festa litúrgica.
 */
export type ContinuationIntent =
  | 'study'     // continuar estudando (mesmo domínio ou irmão)
  | 'deepen'   // aprofundar em outro domínio (CIC, Magistério)
  | 'meet'     // conhecer alguém (padre, santo, doutor)
  | 'pray'     // levar à oração / Lectio
  | 'apply'    // aplicar na vida / jornada
  | 'celebrate'; // festa/tempo litúrgico (Natal, Páscoa, santo do dia)

/** Confiança da recomendação — insumo para diversificação e fallback. */
export type ContinuationConfidence = 'low' | 'medium' | 'high';

/** Metadados opcionais do que o usuário acabou de ler. */
export interface ContinuationMeta {
  bookAbbr?: string;
  chapter?: number;
  totalChapters?: number;
  paragraph?: number;
  nextParagraph?: number;
  journeyId?: string;
  nextStepId?: string;
  theme?: string;
}

/**
 * Contexto bruto emitido pelo Reader.
 * O `resolveContext` normaliza este objeto em `ContinuationContext`.
 */
export interface ContinuationInput {
  kind: ContinuationKind;
  /** ID de domínio da tela (ex.: "gen-1", "142", "sao-francisco"). */
  id?: string;
  /** ID canônico no KnowledgeGraph, se resolvível. */
  graphNodeId?: KnowledgeNodeId;
  /** Temas explicitamente associados a esta leitura. */
  themeIds?: KnowledgeNodeId[];
  /** Metadados livres para fallback e desempate. */
  meta?: ContinuationMeta;
}

/** Contexto normalizado — entrada dos estágios seguintes do pipeline. */
export interface ContinuationContext {
  kind: ContinuationKind;
  /** Kind mapeado para o vocabulário do KnowledgeGraph. */
  graphKind: KnowledgeNodeKind | 'journey-step';
  id?: string;
  graphNodeId?: KnowledgeNodeId;
  themeIds: KnowledgeNodeId[];
  meta: ContinuationMeta;
  /** Timestamp da normalização — insumo para regras litúrgicas futuras. */
  resolvedAt: Date;
}

/** Candidato bruto vindo do grafo, ainda sem pontuação. */
export interface ContinuationCandidate {
  node: ResolvedNode;
  intent: ContinuationIntent;
  /** Motivos que sustentam a candidatura (usados no scorer). */
  reasons: string[];
  /** Peso bruto vindo da aresta do grafo (0..1). */
  rawWeight: number;
}

/** Candidato depois de pontuado — pronto para seleção. */
export interface ScoredCandidate {
  node: ResolvedNode;
  intent: ContinuationIntent;
  /** Score 0..100 (facilita leitura em telemetria e debug). */
  score: number;
  confidence: ContinuationConfidence;
  reasons: string[];
}

/** Sugestão final entregue ao componente visual. */
export interface ContinuationSuggestion {
  intent: ContinuationIntent;
  /** Sobrelinha curta (ex.: "Aprofundar"). */
  eyebrow: string;
  /** Rótulo do CTA. */
  label: string;
  /** Descrição secundária opcional. */
  description?: string;
  /** URL final resolvida. */
  href: string;
  /** Score 0..100 preservado para telemetria/debug. */
  score: number;
  confidence: ContinuationConfidence;
  reasons: string[];
  /** Origem: grafo (recomendação real) ou fallback (rede de segurança). */
  source: 'graph' | 'fallback';
}

export interface ContinuationResult {
  suggestions: ContinuationSuggestion[];
  source: 'graph' | 'fallback' | 'mixed';
  /** Contexto normalizado usado — retornado para telemetria/debug. */
  context: ContinuationContext;
}
