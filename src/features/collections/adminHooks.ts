/**
 * Hooks CRUD do Cathedra Collections Studio.
 *
 * Todas as mutações respeitam a RLS existente (`admins manage collections`).
 * Regra de governança: criação sempre em `draft`; publicação só via mutação
 * explícita (transição admin, sem bypass).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  Collection,
  CollectionItem,
  CollectionItemMetadata,
  CollectionItemType,
} from './types';

export type CollectionStatus = 'draft' | 'review' | 'published' | 'archived';

/** Lista todas as coleções (admin — inclui rascunhos). */
export function useAdminCollections() {
  return useQuery<Collection[]>({
    queryKey: ['admin', 'collections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Collection[];
    },
    staleTime: 30_000,
  });
}

/** Uma coleção + itens (admin — ignora status). */
export function useAdminCollection(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'collection', id],
    enabled: !!id,
    queryFn: async () => {
      const [{ data: c, error: e1 }, { data: items, error: e2 }] = await Promise.all([
        supabase.from('collections').select('*').eq('id', id!).maybeSingle(),
        supabase
          .from('collection_items')
          .select('*')
          .eq('collection_id', id!)
          .order('order_index', { ascending: true }),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return {
        collection: (c as unknown as Collection) ?? null,
        items: (items ?? []) as unknown as CollectionItem[],
      };
    },
  });
}

export interface CollectionInput {
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  cover?: string | null;
  category: string;
  featured?: boolean;
  space?: 'church' | 'library' | 'cloister' | 'atrium';
  eyebrow?: string | null;
  // Metadados editoriais estendidos (Onda 3 · Coleções Inteligentes)
  estimated_reading_time_minutes?: number | null;
  difficulty_level?: 'iniciante' | 'intermediario' | 'avancado' | null;
  hero_quote?: string | null;
  hero_quote_author?: string | null;
  learning_objectives?: string[] | null;
  prerequisites?: string[] | null;
  completion_message?: string | null;
  certificate_eligible?: boolean | null;
}

export function useCreateCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CollectionInput) => {
      const { data, error } = await supabase
        .from('collections')
        .insert({
          slug: input.slug,
          title: input.title,
          subtitle: input.subtitle ?? null,
          description: input.description ?? null,
          cover: input.cover ?? null,
          category: input.category,
          featured: input.featured ?? false,
          status: 'draft', // governança: sempre nasce draft
          nexus_refs: [],
          metadata: {
            space: input.space ?? 'church',
            ...(input.eyebrow ? { eyebrow: input.eyebrow } : {}),
          },
        })
        .select('*')
        .single();
      if (error) throw error;
      return data as unknown as Collection;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'collections'] }),
  });
}

export function useUpdateCollection(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<CollectionInput>) => {
      const dbPatch: Record<string, unknown> = {};
      const keys: (keyof CollectionInput)[] = [
        'slug', 'title', 'subtitle', 'description', 'cover', 'category', 'featured',
        'estimated_reading_time_minutes', 'difficulty_level',
        'hero_quote', 'hero_quote_author',
        'learning_objectives', 'prerequisites',
        'completion_message', 'certificate_eligible',
      ];
      keys.forEach((k) => {
        if (patch[k] !== undefined) dbPatch[k] = patch[k];
      });
      if (patch.space !== undefined || patch.eyebrow !== undefined) {
        const { data: current } = await supabase
          .from('collections')
          .select('metadata')
          .eq('id', id)
          .maybeSingle();
        const meta = (current?.metadata as Record<string, unknown>) ?? {};
        dbPatch.metadata = {
          ...meta,
          ...(patch.space !== undefined ? { space: patch.space } : {}),
          ...(patch.eyebrow !== undefined ? { eyebrow: patch.eyebrow || undefined } : {}),
        };
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from('collections').update(dbPatch as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'collection', id] });
      qc.invalidateQueries({ queryKey: ['admin', 'collections'] });
    },
  });
}

export function useSetCollectionStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (status: CollectionStatus) => {
      const { error } = await supabase.from('collections').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'collection', id] });
      qc.invalidateQueries({ queryKey: ['admin', 'collections'] });
    },
  });
}

export interface AddItemInput {
  collectionId: string;
  itemType: CollectionItemType;
  itemSlug: string;
  titleOverride?: string | null;
  descriptionOverride?: string | null;
  metadata?: CollectionItemMetadata;
}

export function useAddCollectionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddItemInput) => {
      // próxima ordem
      const { data: existing } = await supabase
        .from('collection_items')
        .select('order_index')
        .eq('collection_id', input.collectionId)
        .order('order_index', { ascending: false })
        .limit(1);
      const nextOrder = (existing?.[0]?.order_index ?? 0) + 1;

      const { data, error } = await supabase
        .from('collection_items')
        .insert({
          collection_id: input.collectionId,
          item_type: input.itemType,
          item_slug: input.itemSlug,
          order_index: nextOrder,
          title_override: input.titleOverride ?? null,
          description_override: input.descriptionOverride ?? null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          metadata: (input.metadata ?? {}) as any,
        })
        .select('*')
        .single();
      if (error) throw error;
      return data as unknown as CollectionItem;
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ['admin', 'collection', vars.collectionId] }),
  });
}

export function useRemoveCollectionItem(collectionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from('collection_items').delete().eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'collection', collectionId] }),
  });
}

export function useReorderCollectionItems(collectionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      // Atualiza em bloco. Cada update é rápido; N ≤ ~50 na prática.
      await Promise.all(
        orderedIds.map((id, idx) =>
          supabase
            .from('collection_items')
            .update({ order_index: idx + 1 })
            .eq('id', id)
            .then(({ error }) => {
              if (error) throw error;
            }),
        ),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'collection', collectionId] }),
  });
}
