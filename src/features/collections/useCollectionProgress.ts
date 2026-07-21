import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type {
  CollectionProgressRow,
  CollectionProgressStatus,
} from './types';

type ProgressMap = Record<string, CollectionProgressRow>;

export function useCollectionProgress(collectionId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['collection-progress', collectionId, user?.id];

  const query = useQuery<ProgressMap>({
    queryKey: key,
    enabled: !!collectionId && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collection_progress')
        .select('*')
        .eq('collection_id', collectionId!)
        .eq('user_id', user!.id);
      if (error) throw error;
      const map: ProgressMap = {};
      for (const row of (data ?? []) as unknown as CollectionProgressRow[]) {
        map[row.item_id] = row;
      }
      return map;
    },
    staleTime: 60 * 1000,
  });

  const upsert = useMutation({
    mutationFn: async (params: {
      itemId: string;
      status: CollectionProgressStatus;
      lastPosition?: Record<string, unknown>;
    }) => {
      if (!user?.id || !collectionId) throw new Error('Requer sessão.');
      const now = new Date().toISOString();
      const payload = {
        user_id: user.id,
        collection_id: collectionId,
        item_id: params.itemId,
        status: params.status,
        last_position: (params.lastPosition ?? {}) as never,
        started_at: params.status !== 'not_started' ? now : null,
        completed_at: params.status === 'completed' ? now : null,
      } as never;
      const { data, error } = await supabase
        .from('collection_progress')
        .upsert(payload, { onConflict: 'user_id,item_id' })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as CollectionProgressRow;
    },
    onMutate: async (params) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<ProgressMap>(key) ?? {};
      const optimistic: ProgressMap = {
        ...prev,
        [params.itemId]: {
          ...(prev[params.itemId] ?? ({} as CollectionProgressRow)),
          item_id: params.itemId,
          status: params.status,
          last_position: params.lastPosition ?? {},
        } as CollectionProgressRow,
      };
      qc.setQueryData(key, optimistic);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
    },
  });

  return {
    progress: query.data ?? {},
    isLoading: query.isLoading,
    startItem: (itemId: string) =>
      upsert.mutateAsync({ itemId, status: 'reading' }),
    completeItem: (itemId: string) =>
      upsert.mutateAsync({ itemId, status: 'completed' }),
    resumeItem: (itemId: string, lastPosition?: Record<string, unknown>) =>
      upsert.mutateAsync({ itemId, status: 'reading', lastPosition }),
    getStatus: (itemId: string): CollectionProgressStatus =>
      query.data?.[itemId]?.status ?? 'not_started',
  };
}
