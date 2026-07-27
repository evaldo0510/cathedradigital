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
  /** Onda 3 · quando true, item só desbloqueia após o anterior ser concluído. */
  is_locked_until_prev?: boolean | null;
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
  [k: string]: unknown;
}


export type OfficialTrack =
  | 'formacao-fundamental'
  | 'santos-espiritualidade'
  | 'liturgia'
  | 'vida-crista';

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
  // Onda 3 · Coleções Inteligentes — colunas dedicadas
  estimated_reading_time_minutes?: number | null;
  difficulty_level?: CollectionLevel | null;
  recommended_for?: string[] | null;
  hero_quote?: string | null;
  hero_quote_author?: string | null;
  learning_objectives?: string[] | null;
  prerequisites?: string[] | null;
  completion_message?: string | null;
  certificate_eligible?: boolean | null;
  program_slug?: string | null;
  track?: OfficialTrack | string | null;
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
