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

