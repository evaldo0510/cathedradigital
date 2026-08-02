/**
 * nexusGraphMerge — funde relações CURADAS do banco (`nexus_relations`)
 * dentro de um `ReaderAutoNexusOutput` já produzido por um adapter
 * heurístico.
 *
 * Regras:
 *  - Curadoria tem precedência: entra na frente do bucket.
 *  - Nenhuma URL literal: resolução por `ensureNode` + `KnowledgeGraph.resolve`.
 *  - Sem React, sem Supabase (recebe registros já lidos pelo service).
 *  - Item que não resolve em rota interna é DESCARTADO (nunca card vazio).
 */

import { KnowledgeGraph } from '../KnowledgeGraph';
import type { ResolvedNode } from '../types';
import { KIND_SPECS, ensureNode } from './glossaryAutoNexus';
import {
  BUCKET_EYEBROW,
  intentForBucket,
  type ReaderAutoNexusOutput,
  type ReaderNexusBucket,
} from './ReaderAutoNexus';
import type { ContinuationSuggestion } from '../continuation';

/** Registro curado, agnóstico de origem (Supabase é detalhe do service). */
export interface CuratedNexusEdge {
  /** Kind canônico do Nexus (schema do banco). */
  kind: string;
  /** Identificador natural (slug, número do §, referência bíblica). */
  ref: string;
  /** Rótulo humano para exibição. */
  title?: string | null;
  note?: string | null;
  /** Grau de centralidade no grafo (nº de conexões). Ordena a curadoria. */
  weight?: number | null;
}

/** NexusKind (banco) → bucket do Reader. */
export const NEXUS_KIND_TO_BUCKET: Record<string, ReaderNexusBucket> = {
  bible_verse: 'bible',
  bible: 'bible',
  catechism_paragraph: 'catechism',
  catechism: 'catechism',
  magisterium_doc: 'magisterium',
  magisterium: 'magisterium',
  patristic: 'father',
  father: 'father',
  saint: 'saint',
  glossary: 'glossary',
  prayer: 'prayer',
  journey: 'journey',
  liturgy: 'liturgy',
};

function rebuildSuggestions(
  byBucket: Partial<Record<ReaderNexusBucket, ResolvedNode[]>>,
  order: readonly ReaderNexusBucket[],
  centrality: ReadonlyMap<string, number> = new Map(),
): ContinuationSuggestion[] {
  const out: ContinuationSuggestion[] = [];
  for (const bucket of order) {
    const first = byBucket[bucket]?.[0];
    if (!first?.url) continue;
    out.push({
      intent: intentForBucket(bucket),
      eyebrow: BUCKET_EYEBROW[bucket],
      label: first.node.label,
      target: first,
      weight: 1 + (centrality.get(first.node.id) ?? 0) / 100,
    });
  }
  return out.sort((a, b) => b.weight - a.weight);
}

/**
 * Funde arestas curadas no output do adapter, preservando a ordem
 * canônica de buckets e removendo duplicatas por id de nó.
 */
export function mergeCuratedEdges(
  base: ReaderAutoNexusOutput,
  edges: readonly CuratedNexusEdge[],
  order: readonly ReaderNexusBucket[],
): ReaderAutoNexusOutput {
  if (edges.length === 0) return base;

  const byBucket: Partial<Record<ReaderNexusBucket, ResolvedNode[]>> = {};
  for (const [k, v] of Object.entries(base.byBucket)) {
    byBucket[k as ReaderNexusBucket] = v ? [...v] : [];
  }

  const centrality = new Map<string, number>();
  const curated: Partial<Record<ReaderNexusBucket, ResolvedNode[]>> = {};

  const ranked = [...edges].sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));

  for (const edge of ranked) {
    const bucket = NEXUS_KIND_TO_BUCKET[edge.kind];
    if (!bucket || !order.includes(bucket)) continue;
    const spec = KIND_SPECS[bucket];
    if (!spec) continue;

    const nodeId = ensureNode(spec, edge.ref, edge.title ?? undefined);
    if (!nodeId) continue;
    const resolved = KnowledgeGraph.resolve(nodeId);
    // Sem rota interna → não vira card. Nunca link quebrado.
    if (!resolved?.url) continue;
    if (nodeId === base.selfId) continue;

    const arr = (byBucket[bucket] ??= []);
    const existing = arr.findIndex((r) => r.node.id === nodeId);
    if (existing >= 0) arr.splice(existing, 1);
    (curated[bucket] ??= []).push(resolved); // ordem já é por centralidade
    centrality.set(nodeId, edge.weight ?? 0);
  }

  // Curadoria primeiro, do nó mais central para o menos central.
  for (const [bucket, list] of Object.entries(curated)) {
    const key = bucket as ReaderNexusBucket;
    byBucket[key] = [...(list ?? []), ...(byBucket[key] ?? [])];
  }

  return {
    selfId: base.selfId,
    byBucket,
    labels: base.labels,
    suggestions: rebuildSuggestions(byBucket, order, centrality),
  };
}
