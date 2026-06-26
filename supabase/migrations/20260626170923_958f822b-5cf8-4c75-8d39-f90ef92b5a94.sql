
-- 1) audit_log por job
ALTER TABLE public.bible_import_jobs
  ADD COLUMN IF NOT EXISTS audit_log jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2) Função utilitária: último veredito Sprint 1 por fonte
CREATE OR REPLACE FUNCTION public.bible_source_sprint1_passed(p_source_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT (j.verification #>> '{sprint1,passed}')::boolean
      FROM public.bible_import_jobs j
      WHERE j.source_id = p_source_id
        AND j.status IN ('completed','succeeded','ok')
      ORDER BY COALESCE(j.finished_at, j.updated_at, j.created_at) DESC
      LIMIT 1
    ),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.bible_source_sprint1_passed(uuid) TO authenticated, service_role;

-- 3) Trigger de bloqueio de ativação
CREATE OR REPLACE FUNCTION public.enforce_bible_source_sprint1_gate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_passed boolean;
  v_activating boolean := false;
  v_promoting  boolean := false;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_activating := (NEW.status = 'active');
    v_promoting  := COALESCE(NEW.is_primary, false);
  ELSIF TG_OP = 'UPDATE' THEN
    v_activating := (NEW.status = 'active' AND COALESCE(OLD.status,'') <> 'active');
    v_promoting  := (COALESCE(NEW.is_primary,false) = true AND COALESCE(OLD.is_primary,false) = false);
  END IF;

  IF v_activating OR v_promoting THEN
    v_passed := public.bible_source_sprint1_passed(NEW.id);
    IF NOT v_passed THEN
      RAISE EXCEPTION 'Sprint 1 gate: fonte % bloqueada até verification.sprint1.passed=true no último job concluído.', NEW.id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_bible_source_sprint1_gate ON public.bible_translation_sources;
CREATE TRIGGER trg_enforce_bible_source_sprint1_gate
  BEFORE INSERT OR UPDATE OF status, is_primary
  ON public.bible_translation_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_bible_source_sprint1_gate();
