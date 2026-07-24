
-- =====================================================================
-- CONSTITUIÇÃO EDITORIAL CATHEDRA — Sprint 1
-- Metadados editoriais unificados em todas as tabelas de conteúdo.
-- =====================================================================

-- Enum de status editorial
DO $$ BEGIN
  CREATE TYPE public.editorial_status_enum AS ENUM (
    'draft',
    'doctrinal_review',
    'editorial_review',
    'ice_pending',
    'published',
    'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Função reutilizável: aplica os 8 campos editoriais a uma tabela.
CREATE OR REPLACE FUNCTION public._apply_editorial_columns(_table regclass)
RETURNS void
LANGUAGE plpgsql
AS $fn$
DECLARE
  _sql text;
BEGIN
  _sql := format($f$
    ALTER TABLE %s
      ADD COLUMN IF NOT EXISTS editorial_status public.editorial_status_enum,
      ADD COLUMN IF NOT EXISTS editorial_version integer DEFAULT 1,
      ADD COLUMN IF NOT EXISTS editorial_author uuid,
      ADD COLUMN IF NOT EXISTS editorial_reviewer uuid,
      ADD COLUMN IF NOT EXISTS editorial_reviewed_at timestamptz,
      ADD COLUMN IF NOT EXISTS voice_version text,
      ADD COLUMN IF NOT EXISTS constitution_version text,
      ADD COLUMN IF NOT EXISTS ice_score numeric(5,2)
        CHECK (ice_score IS NULL OR (ice_score >= 0 AND ice_score <= 100))
  $f$, _table);
  EXECUTE _sql;
END;
$fn$;

-- Aplicar a todas as tabelas do escopo aprovado
SELECT public._apply_editorial_columns('public.glossary');
SELECT public._apply_editorial_columns('public.saints');
SELECT public._apply_editorial_columns('public.prayers');
SELECT public._apply_editorial_columns('public.catechism_official');
SELECT public._apply_editorial_columns('public.itineraria');
SELECT public._apply_editorial_columns('public.journeys');
SELECT public._apply_editorial_columns('public.collections');
SELECT public._apply_editorial_columns('public.saint_works');
SELECT public._apply_editorial_columns('public.saint_work_chapters');
SELECT public._apply_editorial_columns('public.bible_verses');

-- Índices em editorial_status para filtros do painel editorial
CREATE INDEX IF NOT EXISTS idx_glossary_editorial_status ON public.glossary(editorial_status);
CREATE INDEX IF NOT EXISTS idx_saints_editorial_status ON public.saints(editorial_status);
CREATE INDEX IF NOT EXISTS idx_prayers_editorial_status ON public.prayers(editorial_status);
CREATE INDEX IF NOT EXISTS idx_catechism_official_editorial_status ON public.catechism_official(editorial_status);
CREATE INDEX IF NOT EXISTS idx_itineraria_editorial_status ON public.itineraria(editorial_status);
CREATE INDEX IF NOT EXISTS idx_journeys_editorial_status ON public.journeys(editorial_status);
CREATE INDEX IF NOT EXISTS idx_collections_editorial_status ON public.collections(editorial_status);
CREATE INDEX IF NOT EXISTS idx_saint_works_editorial_status ON public.saint_works(editorial_status);
CREATE INDEX IF NOT EXISTS idx_saint_work_chapters_editorial_status ON public.saint_work_chapters(editorial_status);
CREATE INDEX IF NOT EXISTS idx_bible_verses_editorial_status ON public.bible_verses(editorial_status);

-- =====================================================================
-- Tabela de eventos do pipeline editorial (auditoria)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.editorial_pipeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_table text NOT NULL,
  entity_id text NOT NULL,
  from_status public.editorial_status_enum,
  to_status public.editorial_status_enum NOT NULL,
  actor uuid,
  notes text,
  ice_score numeric(5,2),
  constitution_version text,
  voice_version text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.editorial_pipeline_events TO authenticated;
GRANT SELECT ON public.editorial_pipeline_events TO anon;
GRANT INSERT ON public.editorial_pipeline_events TO authenticated;
GRANT ALL ON public.editorial_pipeline_events TO service_role;

ALTER TABLE public.editorial_pipeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "editorial_pipeline_events_read_all"
  ON public.editorial_pipeline_events
  FOR SELECT
  USING (true);

CREATE POLICY "editorial_pipeline_events_insert_staff"
  ON public.editorial_pipeline_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.glossary_permissions gp
      WHERE gp.user_id = auth.uid()
        AND gp.role IN ('editor','reviewer','admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_editorial_pipeline_events_entity
  ON public.editorial_pipeline_events(entity_table, entity_id, created_at DESC);
