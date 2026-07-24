
-- 1. Enums
DO $$ BEGIN
  CREATE TYPE public.saint_work_reading_level AS ENUM ('beginner','intermediate','advanced');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.saint_work_ficha_completeness AS ENUM ('stub','minimal','complete');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Colunas aditivas em saint_works
ALTER TABLE public.saint_works
  ADD COLUMN IF NOT EXISTS synopsis TEXT,
  ADD COLUMN IF NOT EXISTS historical_context TEXT,
  ADD COLUMN IF NOT EXISTS why_it_matters TEXT,
  ADD COLUMN IF NOT EXISTS main_themes TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS recommended_audience TEXT,
  ADD COLUMN IF NOT EXISTS reading_level public.saint_work_reading_level,
  ADD COLUMN IF NOT EXISTS editorial_closure JSONB,
  ADD COLUMN IF NOT EXISTS ficha_completeness public.saint_work_ficha_completeness NOT NULL DEFAULT 'stub';

-- 3. Função de recomputação da completude
CREATE OR REPLACE FUNCTION public.saint_works_recompute_ficha_completeness()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  has_minimal BOOLEAN;
  has_closure BOOLEAN;
BEGIN
  has_minimal :=
    NEW.synopsis IS NOT NULL AND length(btrim(NEW.synopsis)) >= 150
    AND NEW.historical_context IS NOT NULL AND length(btrim(NEW.historical_context)) > 0
    AND NEW.why_it_matters IS NOT NULL AND length(btrim(NEW.why_it_matters)) > 0
    AND NEW.main_themes IS NOT NULL AND array_length(NEW.main_themes, 1) >= 2
    AND NEW.reading_level IS NOT NULL;

  has_closure :=
    NEW.editorial_closure IS NOT NULL
    AND jsonb_typeof(NEW.editorial_closure) = 'object'
    AND NEW.editorial_closure ? 'synthesis';

  IF has_minimal AND has_closure THEN
    NEW.ficha_completeness := 'complete';
  ELSIF has_minimal THEN
    NEW.ficha_completeness := 'minimal';
  ELSE
    NEW.ficha_completeness := 'stub';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_saint_works_recompute_ficha ON public.saint_works;
CREATE TRIGGER trg_saint_works_recompute_ficha
  BEFORE INSERT OR UPDATE ON public.saint_works
  FOR EACH ROW EXECUTE FUNCTION public.saint_works_recompute_ficha_completeness();

-- 4. Gate de publicação: exige ficha >= minimal
CREATE OR REPLACE FUNCTION public.saint_works_enforce_publish_gate()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'published' AND NEW.ficha_completeness = 'stub' THEN
    RAISE EXCEPTION 'Obra % nao pode ser publicada: ficha em rascunho (stub). Preencha sinopse, contexto, importancia, temas e nivel de leitura.', NEW.id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_saint_works_publish_gate ON public.saint_works;
CREATE TRIGGER trg_saint_works_publish_gate
  BEFORE INSERT OR UPDATE OF status, ficha_completeness ON public.saint_works
  FOR EACH ROW EXECUTE FUNCTION public.saint_works_enforce_publish_gate();

-- 5. Índice de suporte a filtros no admin
CREATE INDEX IF NOT EXISTS idx_saint_works_ficha_completeness
  ON public.saint_works (ficha_completeness);
CREATE INDEX IF NOT EXISTS idx_saint_works_reading_level
  ON public.saint_works (reading_level);

-- 6. Recomputa completude das linhas existentes (executa trigger via UPDATE noop)
UPDATE public.saint_works SET updated_at = updated_at;
