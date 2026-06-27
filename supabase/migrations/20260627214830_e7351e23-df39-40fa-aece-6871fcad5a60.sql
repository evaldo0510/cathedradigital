
CREATE OR REPLACE FUNCTION public.bible_translations_readiness()
RETURNS TABLE(
  id UUID,
  code TEXT,
  name TEXT,
  author TEXT,
  year_published INTEGER,
  status TEXT,
  is_primary BOOLEAN,
  books_count INTEGER,
  chapters_count INTEGER,
  verses_count INTEGER,
  imported_at TIMESTAMPTZ,
  certified_at TIMESTAMPTZ,
  ready BOOLEAN,
  reason TEXT,
  sprint1_passed BOOLEAN,
  gate_blocked BOOLEAN
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_rec RECORD;
  v_ready RECORD;
BEGIN
  FOR v_rec IN
    SELECT s.id, s.code, s.name, s.author, s.year_published, s.status, s.is_primary,
           s.books_count, s.chapters_count, s.verses_count, s.imported_at, s.certified_at
    FROM public.bible_translation_sources s
    ORDER BY s.is_primary DESC, s.code ASC
  LOOP
    SELECT * INTO v_ready FROM public.bible_translation_ready(v_rec.id) LIMIT 1;
    RETURN QUERY SELECT
      v_rec.id, v_rec.code, v_rec.name, v_rec.author, v_rec.year_published, v_rec.status,
      v_rec.is_primary, v_rec.books_count, v_rec.chapters_count, v_rec.verses_count,
      v_rec.imported_at, v_rec.certified_at,
      COALESCE(v_ready.ready, false), v_ready.reason,
      COALESCE(v_ready.sprint1_passed, false), COALESCE(v_ready.gate_blocked, false);
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.bible_translations_readiness() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bible_translations_readiness() TO authenticated, service_role;
