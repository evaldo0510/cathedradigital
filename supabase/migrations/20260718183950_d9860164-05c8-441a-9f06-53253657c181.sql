
-- 1. Novos campos de rastreabilidade em bible_connections
ALTER TABLE public.bible_connections
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual','csv','json','seed','contribution','official','ai')),
  ADD COLUMN IF NOT EXISTS source_batch_id uuid,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS editor_notes text,
  ADD COLUMN IF NOT EXISTS book_abbr text,
  ADD COLUMN IF NOT EXISTS chapter integer,
  ADD COLUMN IF NOT EXISTS verse integer,
  ADD COLUMN IF NOT EXISTS approved_from_contribution uuid REFERENCES public.nexus_contributions(id) ON DELETE SET NULL;

-- Popular book_abbr/chapter/verse a partir de verse_id existente (formato "ABBR-CH-VS")
UPDATE public.bible_connections
SET
  book_abbr = split_part(verse_id, '-', 1),
  chapter   = NULLIF(split_part(verse_id, '-', 2), '')::int,
  verse     = NULLIF(split_part(verse_id, '-', 3), '')::int
WHERE book_abbr IS NULL AND verse_id ~ '^[^-]+-[0-9]+-[0-9]+$';

CREATE INDEX IF NOT EXISTS bible_connections_book_ch_idx
  ON public.bible_connections (book_abbr, chapter);
CREATE INDEX IF NOT EXISTS bible_connections_source_idx
  ON public.bible_connections (source);

-- 2. Log de imports em lote (CSV/JSON)
CREATE TABLE IF NOT EXISTS public.nexus_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('csv','json','seed','official','ai')),
  filename text,
  total_rows integer NOT NULL DEFAULT 0,
  inserted_rows integer NOT NULL DEFAULT 0,
  skipped_rows integer NOT NULL DEFAULT 0,
  error_rows integer NOT NULL DEFAULT 0,
  errors jsonb,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.nexus_import_batches TO authenticated;
GRANT ALL ON public.nexus_import_batches TO service_role;

ALTER TABLE public.nexus_import_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read import batches"
  ON public.nexus_import_batches FOR SELECT TO authenticated
  USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert import batches"
  ON public.nexus_import_batches FOR INSERT TO authenticated
  WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role) AND created_by = auth.uid());

-- 3. Permitir admins gerenciarem bible_connections diretamente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='bible_connections'
      AND policyname='Admins can manage bible_connections'
  ) THEN
    CREATE POLICY "Admins can manage bible_connections"
      ON public.bible_connections FOR ALL TO authenticated
      USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
      WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bible_connections TO authenticated;

-- 4. Função de aprovação: contribuição -> conexão oficial
CREATE OR REPLACE FUNCTION public.approve_nexus_contribution(
  _contribution_id uuid,
  _reviewer_notes text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _c public.nexus_contributions%ROWTYPE;
  _verse_id text;
  _new_id uuid;
BEGIN
  IF NOT auth_internal.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  SELECT * INTO _c FROM public.nexus_contributions WHERE id = _contribution_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'contribution_not_found'; END IF;
  IF _c.status = 'approved' THEN RAISE EXCEPTION 'already_approved'; END IF;

  _verse_id := _c.book_abbr || '-' || _c.chapter::text || '-' || COALESCE(_c.verse::text, '1');

  INSERT INTO public.bible_connections (
    verse_id, category, reference_title, reference_id, summary,
    source, created_by, updated_by, book_abbr, chapter, verse,
    approved_from_contribution, editor_notes
  ) VALUES (
    _verse_id, _c.connection_type, _c.reference_title, _c.reference_id, _c.summary,
    'contribution', auth.uid(), auth.uid(), _c.book_abbr, _c.chapter, _c.verse,
    _c.id, _reviewer_notes
  ) RETURNING id INTO _new_id;

  UPDATE public.nexus_contributions
  SET status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      reviewer_notes = COALESCE(_reviewer_notes, reviewer_notes),
      updated_at = now()
  WHERE id = _contribution_id;

  RETURN _new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_nexus_contribution(
  _contribution_id uuid,
  _reviewer_notes text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT auth_internal.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  UPDATE public.nexus_contributions
  SET status = 'rejected',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      reviewer_notes = COALESCE(_reviewer_notes, reviewer_notes),
      updated_at = now()
  WHERE id = _contribution_id;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_nexus_contribution(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_nexus_contribution(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_nexus_contribution(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_nexus_contribution(uuid, text) TO authenticated;

-- 5. View de cobertura por capítulo (admin only)
CREATE OR REPLACE VIEW public.nexus_chapter_coverage
WITH (security_invoker = on) AS
SELECT
  b.id            AS book_id,
  b.abbrev        AS book_abbr,
  b.name          AS book_name,
  b.testament,
  b.chapters_count,
  g.chapter,
  COALESCE(c.connections_count, 0) AS connections_count,
  COALESCE(c.connections_count, 0) = 0 AS is_empty
FROM public.bible_books b
CROSS JOIN LATERAL generate_series(1, b.chapters_count) AS g(chapter)
LEFT JOIN (
  SELECT book_abbr, chapter, COUNT(*)::int AS connections_count
  FROM public.bible_connections
  WHERE book_abbr IS NOT NULL AND chapter IS NOT NULL
  GROUP BY book_abbr, chapter
) c ON c.book_abbr = b.abbrev AND c.chapter = g.chapter;

GRANT SELECT ON public.nexus_chapter_coverage TO authenticated;
