/**
 * resolveContinuation — função pura que devolve até N sugestões de
 * "próximo passo" a partir do KnowledgeGraph.
 *
 * Regra: NÃO decide URL. Apenas consulta o grafo, resolve os nós vizinhos
 * e classifica cada um por intenção (study/deepen/pray/apply/meet).
 *
 * Se o grafo não tiver vizinhos suficientes, devolve `[]` — o consumidor
 * (ReaderContinuation) aplica seu fallback editorial.
 */

import { KnowledgeGraph } from '@/core/knowledge/KnowledgeGraph';
import type {
  KnowledgeNode,
  KnowledgeNodeKind,
  KnowledgeRelation,
  KnowledgeRelationKind,
} from '@/core/knowledge/types';
import type {
  ContinuationContext,
  ContinuationIntent,
  ContinuationSuggestion,
} from './types';

const MAX_SUGGESTIONS = 4;

/** Mapa relação → intenção padrão. */
const RELATION_INTENT: Record<KnowledgeRelationKind, ContinuationIntent> = {
  develops: 'study',
  cites: 'study',
  'defined-in': 'deepen',
  'commented-by': 'meet',
  'applies-to': 'apply',
  'prayed-as': 'pray',
  'related-to': 'study',
};

/** Refinamento por kind do nó destino (kind do target vence a relação). */
function intentByTargetKind(kind: KnowledgeNodeKind): ContinuationIntent | null {
  switch (kind) {
    case 'prayer': return 'pray';
    case 'application': return 'apply';
    case 'father':
    case 'saint': return 'meet';
    case 'catechism':
    case 'magisterium':
    case 'council':
    case 'canon': return 'deepen';
    case 'bible': return 'study';
    default: return null;
  }
}

const EYEBROW: Record<ContinuationIntent, string> = {
  study: 'Continuar estudando',
  deepen: 'Aprofundar',
  pray: 'Transformar em oração',
  apply: 'Colocar em prática',
  meet: 'Conheça',
};

interface Candidate {
  targetId: string;
  intent: ContinuationIntent;
  weight: number;
}

/**
 * Coleta candidatos a partir de um conjunto de nós-âncora.
 * Cada âncora contribui com seus vizinhos de saída relevantes.
 */
function collectFromAnchors(anchorIds: string[]): Candidate[] {
  const seen = new Map<string, Candidate>();
  const excluded = new Set(anchorIds);

  for (const anchorId of anchorIds) {
    const relations: KnowledgeRelation[] = KnowledgeGraph.relationsFrom(anchorId);
    for (const rel of relations) {
      if (excluded.has(rel.to)) continue;
      const targetNode = KnowledgeGraph.findNode(rel.to);
      if (!targetNode) continue;
      const intent =
        intentByTargetKind(targetNode.kind) ?? RELATION_INTENT[rel.kind];
      const weight = rel.weight ?? 0.5;
      const prev = seen.get(rel.to);
      if (!prev || prev.weight < weight) {
        seen.set(rel.to, { targetId: rel.to, intent, weight });
      }
    }
  }

  return Array.from(seen.values());
}

export function resolveContinuation(
  ctx: ContinuationContext,
): ContinuationSuggestion[] {
  const anchors: string[] = [];
  if (ctx.currentId && KnowledgeGraph.hasNode(ctx.currentId)) {
    anchors.push(ctx.currentId);
  }
  if (ctx.themeIds) {
    for (const t of ctx.themeIds) {
      if (KnowledgeGraph.hasNode(t)) anchors.push(t);
    }
  }
  if (anchors.length === 0) return [];

  const candidates = collectFromAnchors(anchors);
  candidates.sort((a, b) => b.weight - a.weight);

  // Diversidade de intent: no máximo 1 por intent nas 4 primeiras.
  const takenIntents = new Set<ContinuationIntent>();
  const picked: Candidate[] = [];
  for (const c of candidates) {
    if (picked.length >= MAX_SUGGESTIONS) break;
    if (takenIntents.has(c.intent)) continue;
    takenIntents.add(c.intent);
    picked.push(c);
  }
  // Preenche restantes ignorando restrição de intent, se sobrar espaço.
  if (picked.length < MAX_SUGGESTIONS) {
    for (const c of candidates) {
      if (picked.length >= MAX_SUGGESTIONS) break;
      if (picked.includes(c)) continue;
      picked.push(c);
    }
  }

  const suggestions: ContinuationSuggestion[] = [];
  for (const c of picked) {
    const resolved = KnowledgeGraph.resolve(c.targetId);
    if (!resolved || !resolved.url) continue; // pula nós sem rota
    const node: KnowledgeNode = resolved.node;
    suggestions.push({
      intent: c.intent,
      eyebrow: EYEBROW[c.intent],
      label: node.label,
      target: resolved,
      weight: c.weight,
    });
  }
  return suggestions;
}
