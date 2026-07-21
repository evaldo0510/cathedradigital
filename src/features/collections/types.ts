export type CollectionItemType =
  | 'glossary'
  | 'prayer'
  | 'saint'
  | 'bible'
  | 'liturgy'
  | 'catechism'
  | 'journey';

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

export interface Collection {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover: string | null;
  category: string;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  nexus_refs: unknown[];
  metadata: Record<string, unknown> & { space?: string; eyebrow?: string };
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
