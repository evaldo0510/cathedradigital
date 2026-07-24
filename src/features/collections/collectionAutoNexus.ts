import type { CollectionItem, CollectionItemType } from './types';
import { collectionKindToNexusKind, resolveNexusHref } from '@/lib/nexusHref';

export interface CollectionNexusRef {
  kind: CollectionItemType;
  id: string;
  label: string;
  href: string;
}

/**
 * Adapter Nexus para coleções: transforma os itens (mais overrides) em
 * referências navegáveis prontas para popovers e trilhas.
 *
 * Toda URL passa pelo `resolveNexusHref` canônico (`src/lib/nexusHref.ts`).
 * Itens cuja resolução falhe são descartados — nunca renderizar link quebrado.
 */
export function collectionAutoNexus(items: CollectionItem[]): CollectionNexusRef[] {
  const refs: CollectionNexusRef[] = [];
  for (const it of items) {
    const nexusKind = collectionKindToNexusKind(it.item_type);
    if (!nexusKind) continue;
    const href = resolveNexusHref(nexusKind, it.item_slug);
    if (!href) continue;
    refs.push({
      kind: it.item_type,
      id: it.item_slug,
      label: it.title_override ?? it.item_slug,
      href,
    });
  }
  return refs;
}
