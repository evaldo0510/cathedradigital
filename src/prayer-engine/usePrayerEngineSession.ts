/**
 * usePrayerEngineSession — sessão hierárquica persistente do Prayer Engine v2.
 *
 * Sprint 1.0 · Fase E · Onda 1.
 *
 * Contrato:
 *   const s = usePrayerEngineSession(prayerId);
 *   s.session          — linha atual em prayer_sessions (ou null enquanto carrega)
 *   s.resume()         — devolve a sessão aberta mais recente ou cria nova
 *   s.advance(block)   — marca bloco concluído + move cursor + cascata mistério/seção
 *   s.setCursor(...)   — apenas move o cursor sem marcar conclusão (ex.: usuário voltou)
 *   s.addBookmark(...) — favorito / reflexão / intenção / palavra
 *   s.removeBookmark(id)
 *   s.finish()         — grava completed_at
 *   s.reset()          — abandona a sessão atual e começa outra
 *
 * Persistência é debounced (500ms) para não martelar o banco durante a leitura;
 * há flush no `beforeunload` para não perder o último bloco.
 *
 * Todos os IDs (section/mystery/block) são uuids que vêm do banco (Fase C do
 * plano); o hook não conhece o conteúdo, só a topologia.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type PrayerBookmarkKind = 'favorite' | 'reflection' | 'intention' | 'word';

export interface PrayerBookmark {
  id: string;
  block_id: string;
  kind: PrayerBookmarkKind;
  text?: string;
  created_at: string;
}

export interface AdvanceInput {
  blockId: string;
  mysteryId?: string | null;
  sectionId?: string | null;
  /** Todos os blocos do mesmo mystery (para detectar conclusão do mistério). */
  mysteryBlockIds?: string[];
  /** Todos os mistérios da mesma section (para detectar conclusão da seção). */
  sectionMysteryIds?: string[];
}

export interface PrayerSessionRow {
  id: string;
  user_id: string;
  prayer_id: string;
  current_section_id: string | null;
  current_mystery_id: string | null;
  current_block_uuid: string | null;
  current_block_id: string | null;
  current_block_index: number;
  completed_block_ids: string[];
  completed_mystery_ids: string[];
  completed_section_ids: string[];
  bookmarks: PrayerBookmark[];
  elapsed_seconds: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface UsePrayerEngineSessionResult {
  session: PrayerSessionRow | null;
  loading: boolean;
  error: string | null;
  hasOpenSession: boolean;
  resume: () => Promise<PrayerSessionRow | null>;
  advance: (input: AdvanceInput) => void;
  setCursor: (input: Omit<AdvanceInput, 'mysteryBlockIds' | 'sectionMysteryIds'>) => void;
  addBookmark: (block_id: string, kind: PrayerBookmarkKind, text?: string) => void;
  removeBookmark: (id: string) => void;
  finish: () => Promise<void>;
  reset: () => Promise<PrayerSessionRow | null>;
}

const SAVE_DEBOUNCE_MS = 500;

function uniq(arr: string[]) {
  return Array.from(new Set(arr));
}

function makeId() {
  // Uses browser crypto; falls back to timestamp for SSR/tests.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function fetchOpenSession(userId: string, prayerId: string) {
  const { data, error } = await supabase
    .from('prayer_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('prayer_id', prayerId)
    .is('completed_at', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as PrayerSessionRow | null;
}

/**
 * Cria (ou reabre) a sessão do par user+prayer.
 *
 * `prayer_sessions` tem UNIQUE (user_id, prayer_id): um INSERT simples retorna
 * HTTP 409 sempre que já existe uma sessão concluída para a mesma oração.
 * Usamos upsert idempotente sobre a chave real, zerando o progresso — que é
 * exatamente a semântica de "começar uma nova sessão".
 */
async function createSession(userId: string, prayerId: string) {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('prayer_sessions')
    .upsert(
      {
        user_id: userId,
        prayer_id: prayerId,
        current_section_id: null,
        current_mystery_id: null,
        current_block_uuid: null,
        current_block_id: null,
        current_block_index: 0,
        completed_block_ids: [],
        completed_mystery_ids: [],
        completed_section_ids: [],
        bookmarks: [],
        elapsed_seconds: 0,
        completed_at: null,
        updated_at: nowIso,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      { onConflict: 'user_id,prayer_id' },
    )
    .select('*')
    .single();
  if (error) throw error;
  return data as unknown as PrayerSessionRow;
}


export function usePrayerEngineSession(prayerId: string | undefined): UsePrayerEngineSessionResult {
  const [session, setSession] = useState<PrayerSessionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Fila de patches pendentes (merged) e handle do debounce.
  const pendingPatchRef = useRef<Partial<PrayerSessionRow> | null>(null);
  const flushHandleRef = useRef<number | null>(null);
  const sessionRef = useRef<PrayerSessionRow | null>(null);
  sessionRef.current = session;

  // Auth boot.
  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!alive) return;
      setUserId(data.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setUserId(s?.user?.id ?? null);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const resume = useCallback(async () => {
    if (!userId || !prayerId) return null;
    setLoading(true);
    setError(null);
    try {
      let row = await fetchOpenSession(userId, prayerId);
      if (!row) row = await createSession(userId, prayerId);
      setSession(row);
      return row;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId, prayerId]);

  // Auto-resume quando usuário e oração estão prontos.
  useEffect(() => {
    if (userId && prayerId) {
      void resume();
    } else if (!userId) {
      setLoading(false);
    }
  }, [userId, prayerId, resume]);

  // Flush debounced dos patches acumulados.
  const flush = useCallback(async () => {
    if (flushHandleRef.current) {
      clearTimeout(flushHandleRef.current);
      flushHandleRef.current = null;
    }
    const patch = pendingPatchRef.current;
    const current = sessionRef.current;
    if (!patch || !current) return;
    pendingPatchRef.current = null;
    const { error: e } = await supabase
      .from('prayer_sessions')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ ...patch, updated_at: new Date().toISOString() } as any)
      .eq('id', current.id);
    if (e) setError(e.message);
  }, []);

  // Registra beforeunload uma única vez.
  useEffect(() => {
    const handler = () => {
      // Best-effort — supabase-js não expõe sendBeacon nativo aqui, mas dispara o update.
      void flush();
    };
    window.addEventListener('beforeunload', handler);
    return () => {
      window.removeEventListener('beforeunload', handler);
      void flush();
    };
  }, [flush]);

  const schedulePatch = useCallback(
    (patch: Partial<PrayerSessionRow>) => {
      const merged = { ...(pendingPatchRef.current ?? {}), ...patch };
      pendingPatchRef.current = merged;
      // Otimista: aplica no estado local já.
      setSession((prev) => (prev ? { ...prev, ...patch } : prev));
      if (flushHandleRef.current) clearTimeout(flushHandleRef.current);
      flushHandleRef.current = window.setTimeout(() => {
        void flush();
      }, SAVE_DEBOUNCE_MS);
    },
    [flush],
  );

  const advance = useCallback(
    (input: AdvanceInput) => {
      const current = sessionRef.current;
      if (!current) return;
      const completed_block_ids = uniq([...current.completed_block_ids, input.blockId]);

      let completed_mystery_ids = current.completed_mystery_ids;
      if (
        input.mysteryId &&
        input.mysteryBlockIds &&
        input.mysteryBlockIds.length > 0 &&
        input.mysteryBlockIds.every((b) => completed_block_ids.includes(b))
      ) {
        completed_mystery_ids = uniq([...completed_mystery_ids, input.mysteryId]);
      }

      let completed_section_ids = current.completed_section_ids;
      if (
        input.sectionId &&
        input.sectionMysteryIds &&
        input.sectionMysteryIds.length > 0 &&
        input.sectionMysteryIds.every((m) => completed_mystery_ids.includes(m))
      ) {
        completed_section_ids = uniq([...completed_section_ids, input.sectionId]);
      }

      schedulePatch({
        completed_block_ids,
        completed_mystery_ids,
        completed_section_ids,
        current_block_uuid: input.blockId,
        current_mystery_id: input.mysteryId ?? current.current_mystery_id,
        current_section_id: input.sectionId ?? current.current_section_id,
      });
    },
    [schedulePatch],
  );

  const setCursor = useCallback<UsePrayerEngineSessionResult['setCursor']>(
    (input) => {
      const current = sessionRef.current;
      if (!current) return;
      schedulePatch({
        current_block_uuid: input.blockId,
        current_mystery_id: input.mysteryId ?? current.current_mystery_id,
        current_section_id: input.sectionId ?? current.current_section_id,
      });
    },
    [schedulePatch],
  );

  const addBookmark = useCallback<UsePrayerEngineSessionResult['addBookmark']>(
    (block_id, kind, text) => {
      const current = sessionRef.current;
      if (!current) return;
      // Favorito é toggle único por bloco; os outros são livres.
      const existing = current.bookmarks ?? [];
      let next: PrayerBookmark[];
      if (kind === 'favorite') {
        const already = existing.find((b) => b.block_id === block_id && b.kind === 'favorite');
        next = already
          ? existing.filter((b) => b.id !== already.id)
          : [
              ...existing,
              { id: makeId(), block_id, kind, text, created_at: new Date().toISOString() },
            ];
      } else {
        next = [
          ...existing,
          { id: makeId(), block_id, kind, text, created_at: new Date().toISOString() },
        ];
      }
      schedulePatch({ bookmarks: next });
    },
    [schedulePatch],
  );

  const removeBookmark = useCallback<UsePrayerEngineSessionResult['removeBookmark']>(
    (id) => {
      const current = sessionRef.current;
      if (!current) return;
      schedulePatch({ bookmarks: (current.bookmarks ?? []).filter((b) => b.id !== id) });
    },
    [schedulePatch],
  );

  const finish = useCallback(async () => {
    const current = sessionRef.current;
    if (!current) return;
    await flush();
    const nowIso = new Date().toISOString();
    const { error: e } = await supabase
      .from('prayer_sessions')
      .update({ completed_at: nowIso, updated_at: nowIso })
      .eq('id', current.id);
    if (e) {
      setError(e.message);
      return;
    }
    setSession({ ...current, completed_at: nowIso });
  }, [flush]);

  const reset = useCallback(async () => {
    const current = sessionRef.current;
    if (current && !current.completed_at) {
      // fecha a sessão atual sem contar como concluída (marca com timestamp para sair da fila de "aberta").
      await flush();
      await supabase
        .from('prayer_sessions')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', current.id);
    }
    if (!userId || !prayerId) return null;
    const row = await createSession(userId, prayerId);
    setSession(row);
    return row;
  }, [flush, prayerId, userId]);

  const hasOpenSession = useMemo(
    () =>
      !!session &&
      !session.completed_at &&
      (session.completed_block_ids?.length ?? 0) > 0,
    [session],
  );

  return {
    session,
    loading,
    error,
    hasOpenSession,
    resume,
    advance,
    setCursor,
    addBookmark,
    removeBookmark,
    finish,
    reset,
  };
}
