-- 1) Tabela de fontes de tradução
CREATE TABLE public.bible_translation_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'pt-BR',
  translation TEXT NOT NULL,
  license TEXT NOT NULL,
  attribution TEXT NOT NULL,
  source_url TEXT,
  file_url TEXT,
  notes TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','importing','ready','failed','archived')),
  books_count INT NOT NULL DEFAULT 0,
  chapters_count INT NOT NULL DEFAULT 0,
  verses_count INT NOT NULL DEFAULT 0,
  imported_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bible_translation_sources TO authenticated;
GRANT ALL ON public.bible_translation_sources TO service_role;

ALTER TABLE public.bible_translation_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage translation sources"
  ON public.bible_translation_sources
  FOR ALL
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE TRIGGER trg_bible_translation_sources_updated
  BEFORE UPDATE ON public.bible_translation_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Apenas uma fonte primária por idioma
CREATE UNIQUE INDEX bible_translation_sources_one_primary
  ON public.bible_translation_sources (language)
  WHERE is_primary = true;

-- 2) Tabela de jobs de importação
CREATE TABLE public.bible_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES public.bible_translation_sources(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','running','succeeded','failed','cancelled')),
  progress INT NOT NULL DEFAULT 0,
  total INT NOT NULL DEFAULT 0,
  current_book TEXT,
  message TEXT,
  error TEXT,
  verification JSONB,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bible_import_jobs TO authenticated;
GRANT ALL ON public.bible_import_jobs TO service_role;

ALTER TABLE public.bible_import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage import jobs"
  ON public.bible_import_jobs
  FOR ALL
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE TRIGGER trg_bible_import_jobs_updated
  BEFORE UPDATE ON public.bible_import_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX bible_import_jobs_source_status
  ON public.bible_import_jobs (source_id, status, created_at DESC);