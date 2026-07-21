import type { CollectionItem, CollectionItemType } from './types';

export interface CollectionNexusRef {
  kind: CollectionItemType;
  id: string;
  label: string;
  href: string;
}

const HREF_BY_TYPE: Record<CollectionItemType, (slug: string) => string> = {
  glossary: (s) => `/glossario/${s}`,
  prayer: (s) => `/oracao/${s}`,
  saint: (s) => `/santos/${s}`,
  bible: (s) => `/bible?ref=${encodeURIComponent(s)}`,
  liturgy: (s) => `/liturgia/${s}`,
  catechism: (s) => `/catechism?paragraph=${encodeURIComponent(s)}`,
  journey: (s) => `/jornadas/${s}`,
};

/**
 * Adapter Nexus para coleções: transforma os itens (mais overrides) em
 * referências navegáveis prontas para popovers e trilhas.
 */
export function collectionAutoNexus(items: CollectionItem[]): CollectionNexusRef[] {
  return items.map((it) => ({
    kind: it.item_type,
    id: it.item_slug,
    label: it.title_override ?? it.item_slug,
    href: HREF_BY_TYPE[it.item_type](it.item_slug),
  }));
}
