-- ============================================================
-- Sub-sprint 1 SEG — Orações editoriais (fundação)
-- Migração ADITIVA. Não altera dados existentes.
-- ============================================================

-- 1) Enum de status de curadoria (compartilhado por vários módulos futuros)
DO $$ BEGIN
  CREATE TYPE public.content_curation_status AS ENUM ('stub', 'partial', 'complete');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Campos editoriais expandidos em `prayers`
ALTER TABLE public.prayers
  ADD COLUMN IF NOT EXISTS blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS audio_url text,
  ADD COLUMN IF NOT EXISTS audio_transcript_url text,
  ADD COLUMN IF NOT EXISTS audio_language text DEFAULT 'pt-BR',
  ADD COLUMN IF NOT EXISTS duration_min integer,
  ADD COLUMN IF NOT EXISTS bible_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS catechism_refs integer[] NOT NULL DEFAULT ARRAY[]::integer[],
  ADD COLUMN IF NOT EXISTS content_status public.content_curation_status NOT NULL DEFAULT 'stub';

COMMENT ON COLUMN public.prayers.blocks IS
  'Array editorial de blocos: [{id, kind: intro|mystery|station|hour|meditation|prayer|closing, order, title, subtitle, body, latin, meditation, fruit, bibleRefs[], catechismRefs[], audioUrl}]';
COMMENT ON COLUMN public.prayers.content_status IS
  'Status de curadoria: stub (esqueleto), partial (blocos principais), complete (ficha editorial concluída)';

-- Índices utilitários
CREATE INDEX IF NOT EXISTS idx_prayers_content_status ON public.prayers(content_status);
CREATE INDEX IF NOT EXISTS idx_prayers_blocks_gin ON public.prayers USING gin (blocks);

-- 3) Tabela de sessões de oração (continuidade)
CREATE TABLE IF NOT EXISTS public.prayer_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prayer_id uuid NOT NULL REFERENCES public.prayers(id) ON DELETE CASCADE,
  current_block_id text,
  current_block_index integer NOT NULL DEFAULT 0,
  elapsed_seconds integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, prayer_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prayer_sessions TO authenticated;
GRANT ALL ON public.prayer_sessions TO service_role;

ALTER TABLE public.prayer_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prayer_sessions_owner_select"
  ON public.prayer_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "prayer_sessions_owner_insert"
  ON public.prayer_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prayer_sessions_owner_update"
  ON public.prayer_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prayer_sessions_owner_delete"
  ON public.prayer_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_prayer_sessions_user ON public.prayer_sessions(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayer_sessions_prayer ON public.prayer_sessions(prayer_id);

-- Trigger updated_at (função pública padrão)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prayer_sessions_updated_at ON public.prayer_sessions;
CREATE TRIGGER trg_prayer_sessions_updated_at
  BEFORE UPDATE ON public.prayer_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
