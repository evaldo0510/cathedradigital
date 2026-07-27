/**
 * useCollectionNavigation — deriva o próximo item, item anterior e itens
 * bloqueados (quando `is_locked_until_prev`) a partir da lista ordenada
 * e do mapa de progresso do usuário. Onda 3 · Coleções Inteligentes.
 */
import { useMemo } from 'react';
import type {
  CollectionItem,
  CollectionProgressRow,
  CollectionProgressStatus,
} from '@/features/collections/types';

type ProgressMap = Record<string, CollectionProgressRow>;

export interface CollectionNavigation {
  firstPendingItem: CollectionItem | null;
  nextItem: CollectionItem | null;
  isLocked: (itemId: string) => boolean;
  isCompleted: (itemId: string) => boolean;
  completedCount: number;
  totalCount: number;
  progressPct: number;
  isFinished: boolean;
}

export function useCollectionNavigation(
  items: CollectionItem[],
  progress: ProgressMap,
): CollectionNavigation {
  return useMemo(() => {
    const total = items.length;
    const status = (id: string): CollectionProgressStatus =>
      progress[id]?.status ?? 'not_started';

    const completedCount = items.filter((i) => status(i.id) === 'completed').length;

    const lockedIds = new Set<string>();
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const prev = items[i - 1];
      const locked =
        !!it.is_locked_until_prev &&
        !!prev &&
        status(prev.id) !== 'completed';
      if (locked) lockedIds.add(it.id);
    }

    const firstPending =
      items.find((i) => status(i.id) !== 'completed' && !lockedIds.has(i.id)) ?? null;

    return {
      firstPendingItem: firstPending,
      nextItem: firstPending,
      isLocked: (id) => lockedIds.has(id),
      isCompleted: (id) => status(id) === 'completed',
      completedCount,
      totalCount: total,
      progressPct: total === 0 ? 0 : Math.round((completedCount / total) * 100),
      isFinished: total > 0 && completedCount === total,
    };
  }, [items, progress]);
}
