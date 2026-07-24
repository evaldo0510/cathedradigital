export type CollectionItemType =
  | 'glossary'
  | 'prayer'
  | 'saint'
  | 'saint_work'
  | 'bible'
  | 'liturgy'
  | 'catechism'
  | 'magisterium'
  | 'journey';

export type CollectionLevel = 'iniciante' | 'intermediario' | 'avancado';

export type CollectionProgressStatus =
  | 'not_started'
  | 'reading'
  | 'meditating'
  | 'completed';

export interface CollectionItemMetadata {
  symbol?: string;
  short?: string;
  [k: string]: unknown;
}

export interface CollectionItem {
  id: string;
  collection_id: string;
  item_type: CollectionItemType;
  item_slug: string;
  order_index: number;
  title_override: string | null;
  description_override: string | null;
  metadata: CollectionItemMetadata;
}

/**
 * Metadados editoriais persistidos em `collections.metadata` (jsonb).
 * Sprint Coleções Temáticas · Onda 1 — extensão aditiva, sem migração.
 */
export interface CollectionMetadata {
  space?: string;
  eyebrow?: string;
  /** Descrição editorial curta do objetivo da trilha. */
  editorial_goal?: string;
  /** Tempo estimado total de leitura (minutos). */
  estimated_minutes?: number;
  /** Nível pedagógico. */
  level?: CollectionLevel;
  /** Slugs de coleções relacionadas para recomendação Nexus ao concluir. */
  related_slugs?: string[];
  /** Reflexão final exibida ao completar 100% da trilha. */
  final_reflection?: string;

export interface Collection {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover: string | null;
  category: string;
  status: 'draft' | 'review' | 'published' | 'archived';
  featured: boolean;
  nexus_refs: unknown[];
  metadata: CollectionMetadata;
}

export interface CollectionWithItems {
  collection: Collection;
  items: CollectionItem[];
}

export interface CollectionProgressRow {
  id: string;
  user_id: string;
  collection_id: string;
  item_id: string;
  status: CollectionProgressStatus;
  last_position: Record<string, unknown>;
  started_at: string | null;
  completed_at: string | null;
}
