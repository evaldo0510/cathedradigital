
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
    AND (
      (NEW.editorial_closure ? 'reflection'  AND length(btrim(coalesce(NEW.editorial_closure->>'reflection',''))) > 0)
      OR (NEW.editorial_closure ? 'application' AND length(btrim(coalesce(NEW.editorial_closure->>'application',''))) > 0)
      OR (NEW.editorial_closure ? 'prayer'      AND length(btrim(coalesce(NEW.editorial_closure->>'prayer',''))) > 0)
      OR (NEW.editorial_closure ? 'nexus'       AND jsonb_typeof(NEW.editorial_closure->'nexus') = 'array' AND jsonb_array_length(NEW.editorial_closure->'nexus') > 0)
    );

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
