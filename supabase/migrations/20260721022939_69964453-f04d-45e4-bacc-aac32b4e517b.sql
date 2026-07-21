-- Sprint 1.0 · Fase E · Onda 1 — Persistência hierárquica no Prayer Engine.
-- Amplia prayer_sessions com marcadores e conclusão hierárquica; sem tabelas novas.

ALTER TABLE public.prayer_sessions
  ADD COLUMN IF NOT EXISTS completed_mystery_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  ADD COLUMN IF NOT EXISTS completed_section_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  ADD COLUMN IF NOT EXISTS bookmarks jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Índice parcial para retomada rápida (uma sessão aberta por oração/usuário).
CREATE INDEX IF NOT EXISTS prayer_sessions_open_by_user_prayer_idx
  ON public.prayer_sessions (user_id, prayer_id, updated_at DESC)
  WHERE completed_at IS NULL;

-- Validação leve: bookmarks deve ser array JSON.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'prayer_sessions_bookmarks_is_array_chk'
  ) THEN
    ALTER TABLE public.prayer_sessions
      ADD CONSTRAINT prayer_sessions_bookmarks_is_array_chk
      CHECK (jsonb_typeof(bookmarks) = 'array');
  END IF;
END $$;