
DO $$ BEGIN
  CREATE TYPE public.bible_translation_pipeline_stage AS ENUM (
    'draft','importing','integrity_check','editorial_review','ice','certified','primary','archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.bible_translation_sources
  ADD COLUMN IF NOT EXISTS pipeline_stage public.bible_translation_pipeline_stage
    NOT NULL DEFAULT 'draft';

UPDATE public.bible_translation_sources
   SET pipeline_stage = CASE
     WHEN status = 'archived' THEN 'archived'::public.bible_translation_pipeline_stage
     WHEN is_primary THEN 'primary'::public.bible_translation_pipeline_stage
     WHEN status = 'ready'   THEN 'editorial_review'::public.bible_translation_pipeline_stage
     ELSE 'draft'::public.bible_translation_pipeline_stage
   END
 WHERE pipeline_stage = 'draft';

ALTER TABLE public.bible_translation_phase_status
  ADD COLUMN IF NOT EXISTS check_search BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.enforce_phase_certification_gate()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'certified' THEN
    IF NOT (NEW.check_verses AND NEW.check_references AND NEW.check_nexus
        AND NEW.check_popovers AND NEW.check_reader AND NEW.check_navigation
        AND NEW.check_continuity AND NEW.check_search) THEN
      RAISE EXCEPTION 'Não é possível certificar a fase % — checklist incompleto.', NEW.phase
        USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.ice_score IS NULL OR NEW.ice_score < 95 THEN
      RAISE EXCEPTION 'Não é possível certificar a fase % — ICE (%) < 95.', NEW.phase, NEW.ice_score
        USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.certified_at IS NULL THEN NEW.certified_at := now(); END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TABLE IF NOT EXISTS public.bible_translation_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  translation_id UUID NOT NULL REFERENCES public.bible_translation_sources(id) ON DELETE CASCADE,
  phase public.bible_import_phase NOT NULL,
  reviewer UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ice INT,
  approved BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  checksum TEXT,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bible_certs_translation_phase
  ON public.bible_translation_certifications (translation_id, phase, reviewed_at DESC);

GRANT SELECT, INSERT ON public.bible_translation_certifications TO authenticated;
GRANT ALL ON public.bible_translation_certifications TO service_role;
ALTER TABLE public.bible_translation_certifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin read certifications" ON public.bible_translation_certifications;
CREATE POLICY "admin read certifications" ON public.bible_translation_certifications
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admin insert certifications" ON public.bible_translation_certifications;
CREATE POLICY "admin insert certifications" ON public.bible_translation_certifications
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP FUNCTION IF EXISTS public.get_bible_phase_summary();

CREATE OR REPLACE FUNCTION public.get_bible_phase_summary()
RETURNS TABLE (
  translation_id UUID, translation_code TEXT, translation_name TEXT,
  translation_status TEXT, pipeline_stage public.bible_translation_pipeline_stage,
  is_primary BOOLEAN, phase public.bible_import_phase,
  expected_books INT, expected_chapters INT,
  actual_books INT, actual_chapters INT, actual_verses BIGINT,
  status public.bible_phase_status, certified_at TIMESTAMPTZ, ice_score INT,
  check_verses BOOLEAN, check_references BOOLEAN, check_nexus BOOLEAN,
  check_popovers BOOLEAN, check_reader BOOLEAN, check_navigation BOOLEAN,
  check_continuity BOOLEAN, check_search BOOLEAN
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT ts.id, ts.code, ts.name, ts.status::TEXT, ts.pipeline_stage, ts.is_primary,
         p.phase, p.expected_books, p.expected_chapters,
         p.actual_books, p.actual_chapters, p.actual_verses,
         p.status, s.certified_at, s.ice_score,
         COALESCE(s.check_verses,false), COALESCE(s.check_references,false),
         COALESCE(s.check_nexus,false), COALESCE(s.check_popovers,false),
         COALESCE(s.check_reader,false), COALESCE(s.check_navigation,false),
         COALESCE(s.check_continuity,false), COALESCE(s.check_search,false)
  FROM public.bible_translation_sources ts
  CROSS JOIN LATERAL public.get_translation_progress(ts.id) p
  LEFT JOIN public.bible_translation_phase_status s
    ON s.translation_id = ts.id AND s.phase = p.phase
  ORDER BY ts.is_primary DESC, ts.pipeline_stage DESC, ts.name, p.phase;
$$;

GRANT EXECUTE ON FUNCTION public.get_bible_phase_summary() TO authenticated, service_role;
