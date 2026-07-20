/**
 * usePrayerSession — continuidade da oração.
 *
 * Persiste em `prayer_sessions` (RLS por dono) para retomar exatamente no
 * bloco em que a pessoa parou. Fallback anônimo: `localStorage`.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const STORAGE_PREFIX = 'cathedra:prayer:session:';

export interface PrayerSessionState {
  currentBlockIndex: number;
  currentBlockId: string | null;
  elapsedSeconds: number;
  completed: boolean;
}

const EMPTY: PrayerSessionState = {
  currentBlockIndex: 0,
  currentBlockId: null,
  elapsedSeconds: 0,
  completed: false,
};

export function usePrayerSession(prayerId: string | null | undefined, blockIds: string[]) {
  const { user } = useAuth();
  const [state, setState] = useState<PrayerSessionState>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const lastSavedRef = useRef<string>('');

  // Load
  useEffect(() => {
    if (!prayerId) return;
    let alive = true;
    (async () => {
      if (user) {
        const { data } = await supabase
          .from('prayer_sessions')
          .select('current_block_index,current_block_id,elapsed_seconds,completed_at')
          .eq('user_id', user.id)
          .eq('prayer_id', prayerId)
          .maybeSingle();
        if (!alive) return;
        if (data) {
          setState({
            currentBlockIndex: data.current_block_index ?? 0,
            currentBlockId: data.current_block_id,
            elapsedSeconds: data.elapsed_seconds ?? 0,
            completed: !!data.completed_at,
          });
        }
      } else {
        try {
          const raw = localStorage.getItem(`${STORAGE_PREFIX}${prayerId}`);
          if (raw && alive) setState({ ...EMPTY, ...JSON.parse(raw) });
        } catch {
          /* noop */
        }
      }
      if (alive) setLoaded(true);
    })();
    return () => {
      alive = false;
    };
  }, [prayerId, user]);

  const save = useCallback(
    async (next: Partial<PrayerSessionState>) => {
      if (!prayerId) return;
      setState((prev) => {
        const merged = { ...prev, ...next };
        const key = JSON.stringify(merged);
        if (key === lastSavedRef.current) return merged;
        lastSavedRef.current = key;
        if (user) {
          supabase
            .from('prayer_sessions')
            .upsert(
              {
                user_id: user.id,
                prayer_id: prayerId,
                current_block_index: merged.currentBlockIndex,
                current_block_id: merged.currentBlockId,
                elapsed_seconds: merged.elapsedSeconds,
                completed_at: merged.completed ? new Date().toISOString() : null,
              },
              { onConflict: 'user_id,prayer_id' },
            )
            .then(({ error }) => {
              if (error) console.warn('[prayer-session] save error:', error.message);
            });
        } else {
          try {
            localStorage.setItem(`${STORAGE_PREFIX}${prayerId}`, JSON.stringify(merged));
          } catch {
            /* noop */
          }
        }
        return merged;
      });
    },
    [prayerId, user],
  );

  const setIndex = useCallback(
    (i: number) => {
      const clamped = Math.max(0, Math.min(blockIds.length - 1, i));
      save({
        currentBlockIndex: clamped,
        currentBlockId: blockIds[clamped] ?? null,
        completed: clamped === blockIds.length - 1 ? state.completed : false,
      });
    },
    [blockIds, save, state.completed],
  );

  const markCompleted = useCallback(() => save({ completed: true }), [save]);
  const reset = useCallback(
    () => save({ currentBlockIndex: 0, currentBlockId: blockIds[0] ?? null, elapsedSeconds: 0, completed: false }),
    [save, blockIds],
  );

  return { state, loaded, setIndex, markCompleted, reset };
}
