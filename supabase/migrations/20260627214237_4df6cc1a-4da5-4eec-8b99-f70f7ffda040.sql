
-- 1) Estende bible_translation_sources
ALTER TABLE public.bible_translation_sources
  ADD COLUMN IF NOT EXISTS author TEXT,
  ADD COLUMN IF NOT EXISTS year_published INTEGER,
  ADD COLUMN IF NOT EXISTS source_origin TEXT,
  ADD COLUMN IF NOT EXISTS payload_hash TEXT,
  ADD COLUMN IF NOT EXISTS payload_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS import_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS import_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS certified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS certified_by UUID,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.bible_translation_sources.author IS 'Autor/tradutor responsável pela obra';
COMMENT ON COLUMN public.bible_translation_sources.year_published IS 'Ano original da tradução';
COMMENT ON COLUMN public.bible_translation_sources.source_origin IS 'Origem dos arquivos importados (URL canônica, arquivo, dump)';
COMMENT ON COLUMN public.bible_translation_sources.payload_hash IS 'Hash SHA-256 da carga importada para garantir integridade';
COMMENT ON COLUMN public.bible_translation_sources.certified_at IS 'Quando a infraestrutura soberana foi certificada para publicar esta tradução';

-- Preenche código primário existente com metadata mínima conhecida (Figueiredo 1790)
UPDATE public.bible_translation_sources
SET author = COALESCE(author, 'Pe. António Pereira de Figueiredo'),
    year_published = COALESCE(year_published, 1790),
    source_origin = COALESCE(source_origin, file_url, source_url, 'dump-interno')
WHERE code = 'figueiredo-1790';

-- 2) Adiciona translation_id em bible_verses
ALTER TABLE public.bible_verses
  ADD COLUMN IF NOT EXISTS translation_id UUID
    REFERENCES public.bible_translation_sources(id) ON DELETE CASCADE;

-- Backfill: versos existentes vão para a tradução primária atual
UPDATE public.bible_verses v
SET translation_id = (
  SELECT id FROM public.bible_translation_sources
  WHERE is_primary = true
  ORDER BY created_at ASC LIMIT 1
)
WHERE translation_id IS NULL;

ALTER TABLE public.bible_verses
  ALTER COLUMN translation_id SET NOT NULL;

-- Substitui unique (chapter_id, number) por (chapter_id, translation_id, number)
ALTER TABLE public.bible_verses
  DROP CONSTRAINT IF EXISTS bible_verses_chapter_id_number_key;

ALTER TABLE public.bible_verses
  ADD CONSTRAINT bible_verses_chapter_translation_number_key
  UNIQUE (chapter_id, translation_id, number);

CREATE INDEX IF NOT EXISTS idx_bible_verses_translation
  ON public.bible_verses(translation_id);

CREATE INDEX IF NOT EXISTS idx_bible_verses_chapter_translation
  ON public.bible_verses(chapter_id, translation_id);

-- 3) Camada de modernização ortográfica (opcional, preserva original)
CREATE TABLE IF NOT EXISTS public.bible_verse_modernizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  verse_id UUID NOT NULL REFERENCES public.bible_verses(id) ON DELETE CASCADE,
  translation_id UUID NOT NULL REFERENCES public.bible_translation_sources(id) ON DELETE CASCADE,
  modernization_version TEXT NOT NULL DEFAULT 'v1',
  modernized_text TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'manual',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (verse_id, modernization_version)
);

GRANT SELECT ON public.bible_verse_modernizations TO anon, authenticated;
GRANT ALL ON public.bible_verse_modernizations TO service_role;

ALTER TABLE public.bible_verse_modernizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read verse modernizations"
  ON public.bible_verse_modernizations FOR SELECT
  USING (true);

CREATE POLICY "Admins manage verse modernizations"
  ON public.bible_verse_modernizations FOR ALL
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE TRIGGER trg_bible_verse_modernizations_updated
  BEFORE UPDATE ON public.bible_verse_modernizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_bible_verse_modernizations_verse
  ON public.bible_verse_modernizations(verse_id);

COMMENT ON TABLE public.bible_verse_modernizations IS
  'Camada opcional de modernização ortográfica. O texto original em bible_verses.text JAMAIS é alterado.';

-- 4) Gate de prontidão por tradução
CREATE OR REPLACE FUNCTION public.bible_translation_ready(p_translation_id UUID)
RETURNS TABLE(ready BOOLEAN, reason TEXT, sprint1_passed BOOLEAN, gate_blocked BOOLEAN)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_sprint1 BOOLEAN;
  v_gate RECORD;
BEGIN
  v_sprint1 := public.bible_source_sprint1_passed(p_translation_id);
  SELECT * INTO v_gate FROM public.bible_read_gate_status() LIMIT 1;

  IF NOT v_sprint1 THEN
    RETURN QUERY SELECT false, 'Tradução não passou no gate Sprint 1.'::text, v_sprint1, COALESCE(v_gate.blocked, false);
    RETURN;
  END IF;

  IF COALESCE(v_gate.blocked, false) THEN
    RETURN QUERY SELECT false, 'Infraestrutura soberana bloqueada: ' || COALESCE(v_gate.reason,'sem diagnose'), v_sprint1, true;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'Infraestrutura certificada — pronta para publicar tradução.'::text, v_sprint1, false;
END;
$$;

REVOKE ALL ON FUNCTION public.bible_translation_ready(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bible_translation_ready(UUID) TO authenticated, service_role;
