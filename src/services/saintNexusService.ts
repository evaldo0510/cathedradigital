/**
 * saintNexusService — leitura das relações curadas do Knowledge Graph
 * ligadas a um santo (Sprint 4 · Nexus v1).
 *
 * Consome `public.nexus_relations` filtrando por `source_kind = 'saint'`
 * e `source_ref->>'id' = <slug>`. Não duplica lógica dos adapters
 * heurísticos (`saintAutoNexus`); complementa-os com dados curados.
 */

import { supabase } from '@/integrations/supabase/client';
import type { NexusRelation, SaintNexusRelation } from '@/types/nexus';
import type { CuratedNexusEdge } from '@/core/knowledge/adapters/nexusGraphMerge';
import { withCentrality } from './nexusCentrality';

export interface SaintRelationGroups {
  works: NexusRelation[];
  virtues: NexusRelation[];
  relatedSaints: NexusRelation[];
  /** Parágrafos do Catecismo ligados ao santo (Catecismo ⇄ Santos). */
  catechism: NexusRelation[];
  inspired: NexusRelation[];
  all: NexusRelation[];
}

const EMPTY: SaintRelationGroups = {
  works: [],
  virtues: [],
  relatedSaints: [],
  catechism: [],
  inspired: [],
  all: [],
};

export async function getSaintRelations(saintId: string): Promise<SaintRelationGroups> {
  if (!saintId) return EMPTY;

  const { data, error } = await supabase
    .from('nexus_relations')
    .select('id, relation_type, source_kind, source_ref, target_kind, target_ref, attributed_to, note, confidence')
    .eq('source_kind', 'saint')
    .filter('source_ref->>id', 'eq', saintId)
    .in('relation_type', ['wrote', 'exemplifies', 'related_to', 'inspired_by']);

  if (error || !data) return EMPTY;

  const all = data as unknown as NexusRelation[];
  return {
    works: all.filter((r) => r.relation_type === ('wrote' as SaintNexusRelation)),
    virtues: all.filter((r) => r.relation_type === ('exemplifies' as SaintNexusRelation)),
    relatedSaints: all.filter(
      (r) => r.relation_type === ('related_to' as SaintNexusRelation) && r.target_kind === 'saint',
    ),
    catechism: all.filter((r) => r.target_kind === 'catechism_paragraph'),
    inspired: all.filter((r) => r.relation_type === ('inspired_by' as SaintNexusRelation)),
    all,
  };
}


/**
 * Arestas curadas de um santo, nas DUAS direções, já normalizadas para o
 * merge do grafo (`mergeCuratedEdges`). Complementa o adapter heurístico
 * sem duplicar rotas nem lógica de bucket.
 */
export async function getSaintCuratedEdges(saintId: string): Promise<CuratedNexusEdge[]> {
  if (!saintId) return [];
  const cols = 'relation_type, source_kind, source_ref, target_kind, target_ref, note';

  const [outgoing, incoming] = await Promise.all([
    supabase.from('nexus_relations').select(cols)
      .eq('source_kind', 'saint').filter('source_ref->>id', 'eq', saintId).limit(120),
    supabase.from('nexus_relations').select(cols)
      .eq('target_kind', 'saint').filter('target_ref->>id', 'eq', saintId).limit(120),
  ]);

  const edges: CuratedNexusEdge[] = [];
  const seen = new Set<string>();
  const push = (kind: string, ref: Record<string, unknown> | null, note: string | null) => {
    if (!ref || kind === 'saint' || kind === 'other') return;
    let id: string | null = null;
    for (const k of ['slug', 'id', 'ref'] as const) {
      const v = ref[k];
      if (typeof v === 'string' && v.trim()) { id = v.trim(); break; }
      if (typeof v === 'number' && Number.isFinite(v)) { id = String(v); break; }
    }
    if (!id) return;
    const key = `${kind}#${id}`;
    if (seen.has(key)) return;
    seen.add(key);
    const title = typeof ref.title === 'string' && ref.title.trim() ? ref.title.trim() : null;
    edges.push({ kind, ref: id, title, note });
  };

  type Row = {
    source_kind: string; source_ref: Record<string, unknown> | null;
    target_kind: string; target_ref: Record<string, unknown> | null; note: string | null;
  };
  for (const r of ((outgoing.data ?? []) as unknown as Row[])) push(r.target_kind, r.target_ref, r.note);
  for (const r of ((incoming.data ?? []) as unknown as Row[])) push(r.source_kind, r.source_ref, r.note);
  return withCentrality(edges);
}
