/**
 * Cathedra · Nexus Knowledge Graph — tipos compartilhados
 * Sprint 4 (Nexus v1). Reflete o schema real de `public.nexus_relations`
 * e `public.nexus_relation_types`.
 */

export type NexusKind =
  | 'bible_verse'
  | 'catechism_paragraph'
  | 'magisterium_doc'
  | 'patristic'
  | 'saint'
  | 'saint_work'
  | 'glossary'
  | 'prayer'
  | 'journey'
  | 'liturgy'
  | 'other';

export type NexusRelationCode =
  | 'cites'
  | 'explains'
  | 'contrasts'
  | 'fulfills'
  | 'commemorates'
  | 'see_also'
  | 'wrote'
  | 'exemplifies'
  | 'related_to'
  | 'inspired_by';

export type SaintNexusRelation =
  | 'wrote'
  | 'exemplifies'
  | 'related_to'
  | 'inspired_by';

export interface NexusRef {
  id: string;
  title?: string;
  author?: string;
  [k: string]: unknown;
}

export interface NexusRelation {
  id: string;
  relation_type: NexusRelationCode;
  source_kind: NexusKind;
  source_ref: NexusRef;
  target_kind: NexusKind;
  target_ref: NexusRef;
  attributed_to?: string | null;
  note?: string | null;
  confidence?: number | null;
}
