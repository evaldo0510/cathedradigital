/**
 * Continuation — contrato de domínio para "próximo passo" ao final
 * de qualquer leitura. Consumido pelo ReaderContinuation (UI) e por
 * qualquer outro componente que queira sugerir continuidade.
 *
 * Puro: sem React, sem Supabase, sem URLs literais.
 */

import type {
  KnowledgeNodeId,
  KnowledgeNodeKind,
  ResolvedNode,
} from '@/core/knowledge/types';

/** Intenção espiritual/pedagógica da sugestão. */
export type ContinuationIntent =
  | 'study'   // continuar estudando (mesmo domínio ou domínio irmão)
  | 'deepen'  // aprofundar em outro domínio (CIC, Magistério)
  | 'pray'    // levar à oração / Lectio
  | 'apply'   // aplicar na vida / jornada
  | 'meet';   // conhecer alguém (padre, santo)

/** Contexto do que o usuário acabou de ler. */
export interface ContinuationContext {
  /** Kind do conteúdo atual (bible, catechism, magisterium, saint, journey-step). */
  currentKind: KnowledgeNodeKind | 'journey-step';
  /** ID canônico do nó no grafo, se resolvível. */
  currentId?: KnowledgeNodeId;
  /** Temas explicitamente associados a esta leitura. */
  themeIds?: KnowledgeNodeId[];
  /** Dicas livres para desempate/filtragem. */
  hints?: Record<string, string | number | boolean>;
}

/** Uma sugestão pronta para render. */
export interface ContinuationSuggestion {
  intent: ContinuationIntent;
  /** Sobrelinha curta (ex.: "Aprofundar"). */
  eyebrow: string;
  /** Rótulo do CTA (label curto do nó destino). */
  label: string;
  /** Nó resolvido com URL final. */
  target: ResolvedNode;
  /** Peso 0..1 para ordenação. */
  weight: number;
}
