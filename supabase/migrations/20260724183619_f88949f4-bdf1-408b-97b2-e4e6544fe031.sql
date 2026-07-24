
-- editorial_closure (JSONB): { reflection, application, prayer, next: { label, href, kicker } }
ALTER TABLE public.glossary            ADD COLUMN IF NOT EXISTS editorial_closure jsonb;
ALTER TABLE public.saints              ADD COLUMN IF NOT EXISTS editorial_closure jsonb;
ALTER TABLE public.prayers             ADD COLUMN IF NOT EXISTS editorial_closure jsonb;
ALTER TABLE public.catechism_official  ADD COLUMN IF NOT EXISTS editorial_closure jsonb;
ALTER TABLE public.saint_works         ADD COLUMN IF NOT EXISTS editorial_closure jsonb;

-- Trigger genérico: bloqueia editorial_status='published' sem checklist mínimo.
CREATE OR REPLACE FUNCTION public.enforce_editorial_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.editorial_status IS DISTINCT FROM 'published'::public.editorial_status_enum THEN
    RETURN NEW;
  END IF;

  -- Admin bypass (permite força manual em correções).
  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.ice_score IS NULL OR NEW.ice_score < 95 THEN
    RAISE EXCEPTION 'Publicação bloqueada: ICE < 95 (atual=%).', NEW.ice_score;
  END IF;
  IF NEW.editorial_closure IS NULL THEN
    RAISE EXCEPTION 'Publicação bloqueada: editorial_closure ausente.';
  END IF;
  IF NEW.editorial_author IS NULL OR NEW.editorial_reviewer IS NULL THEN
    RAISE EXCEPTION 'Publicação bloqueada: autor e revisor obrigatórios.';
  END IF;
  IF NEW.editorial_author = NEW.editorial_reviewer THEN
    RAISE EXCEPTION 'Publicação bloqueada: autor e revisor devem ser distintos.';
  END IF;
  IF NEW.constitution_version IS DISTINCT FROM '1.0.0' THEN
    RAISE EXCEPTION 'Publicação bloqueada: constitution_version deve ser 1.0.0.';
  END IF;
  IF NEW.voice_version IS DISTINCT FROM '1.0.0' THEN
    RAISE EXCEPTION 'Publicação bloqueada: voice_version deve ser 1.0.0.';
  END IF;

  RETURN NEW;
END;
$$;

-- Ajusta search_path do helper criado na migration anterior (fix linter WARN).
ALTER FUNCTION public._apply_editorial_columns(regclass) SET search_path = public;

-- Aplica o trigger nas 5 tabelas de leitura editorial.
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'glossary','saints','prayers','catechism_official','saint_works'
  ]) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_enforce_editorial_publish ON public.%I;', t);
    EXECUTE format(
      'CREATE TRIGGER trg_enforce_editorial_publish
         BEFORE INSERT OR UPDATE OF editorial_status, ice_score, editorial_closure,
                                    editorial_author, editorial_reviewer,
                                    constitution_version, voice_version
         ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.enforce_editorial_publish();',
      t
    );
  END LOOP;
END $$;
