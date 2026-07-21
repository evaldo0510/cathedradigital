import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  Collection,
  CollectionItem,
  CollectionWithItems,
} from './types';

export function useCollection(slug: string | undefined) {
  return useQuery<CollectionWithItems | null>({
    queryKey: ['collection', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data: collection, error } = await supabase
        .from('collections')
        .select('*')
        .eq('slug', slug!)
        .eq('status', 'published')
        .maybeSingle();
      if (error) throw error;
      if (!collection) return null;

      const { data: items, error: itemsError } = await supabase
        .from('collection_items')
        .select('*')
        .eq('collection_id', collection.id)
        .order('order_index', { ascending: true });
      if (itemsError) throw itemsError;

      return {
        collection: collection as unknown as Collection,
        items: (items ?? []) as unknown as CollectionItem[],
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
