
-- 1) Audit table
CREATE TABLE IF NOT EXISTS public.saint_works_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id uuid NOT NULL REFERENCES public.saint_works(id) ON DELETE CASCADE,
  chapter_id uuid REFERENCES public.saint_work_chapters(id) ON DELETE CASCADE,
  action text NOT NULL,
  from_status public.saint_work_status,
  to_status public.saint_work_status,
  changed_fields text[] NOT NULL DEFAULT '{}',
  actor_id uuid,
  actor_email text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saint_works_audit_work ON public.saint_works_audit(work_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saint_works_audit_chapter ON public.saint_works_audit(chapter_id, created_at DESC);

GRANT SELECT, INSERT ON public.saint_works_audit TO authenticated;
GRANT ALL ON public.saint_works_audit TO service_role;

ALTER TABLE public.saint_works_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saint_works_audit_admin_read" ON public.saint_works_audit;
CREATE POLICY "saint_works_audit_admin_read"
  ON public.saint_works_audit FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "saint_works_audit_admin_insert" ON public.saint_works_audit;
CREATE POLICY "saint_works_audit_admin_insert"
  ON public.saint_works_audit FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2) Helper: current actor email (best effort, avoids exposing auth.users)
CREATE OR REPLACE FUNCTION public._current_actor_email()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$;

-- 3) Audit trigger for saint_works
CREATE OR REPLACE FUNCTION public.saint_works_audit_trigger()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_email text := public._current_actor_email();
  v_changed text[] := '{}';
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.saint_works_audit(work_id, action, from_status, to_status, changed_fields, actor_id, actor_email)
    VALUES (NEW.id, 'created', NULL, NEW.status, ARRAY['*'], v_actor, v_email);
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.title IS DISTINCT FROM OLD.title THEN v_changed := array_append(v_changed, 'title'); END IF;
    IF NEW.abstract IS DISTINCT FROM OLD.abstract THEN v_changed := array_append(v_changed, 'abstract'); END IF;
    IF NEW.license IS DISTINCT FROM OLD.license THEN v_changed := array_append(v_changed, 'license'); END IF;
    IF NEW.translation_credit IS DISTINCT FROM OLD.translation_credit THEN v_changed := array_append(v_changed, 'translation_credit'); END IF;
    IF NEW.source_url IS DISTINCT FROM OLD.source_url THEN v_changed := array_append(v_changed, 'source_url'); END IF;
    IF NEW.is_public_domain IS DISTINCT FROM OLD.is_public_domain THEN v_changed := array_append(v_changed, 'is_public_domain'); END IF;
    IF NEW.category IS DISTINCT FROM OLD.category THEN v_changed := array_append(v_changed, 'category'); END IF;
    IF NEW.cover_image_url IS DISTINCT FROM OLD.cover_image_url THEN v_changed := array_append(v_changed, 'cover_image_url'); END IF;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.saint_works_audit(work_id, action, from_status, to_status, changed_fields, actor_id, actor_email)
      VALUES (NEW.id, 'status_changed', OLD.status, NEW.status, v_changed, v_actor, v_email);
    ELSIF array_length(v_changed, 1) IS NOT NULL THEN
      INSERT INTO public.saint_works_audit(work_id, action, from_status, to_status, changed_fields, actor_id, actor_email)
      VALUES (NEW.id, 'updated', OLD.status, NEW.status, v_changed, v_actor, v_email);
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_saint_works_audit ON public.saint_works;
CREATE TRIGGER trg_saint_works_audit
AFTER INSERT OR UPDATE ON public.saint_works
FOR EACH ROW EXECUTE FUNCTION public.saint_works_audit_trigger();

-- 4) Audit trigger for chapters
CREATE OR REPLACE FUNCTION public.saint_work_chapters_audit_trigger()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_email text := public._current_actor_email();
  v_changed text[] := '{}';
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.saint_works_audit(work_id, chapter_id, action, changed_fields, actor_id, actor_email)
    VALUES (NEW.work_id, NEW.id, 'chapter_created', ARRAY['*'], v_actor, v_email);
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.title IS DISTINCT FROM OLD.title THEN v_changed := array_append(v_changed, 'title'); END IF;
    IF NEW.subtitle IS DISTINCT FROM OLD.subtitle THEN v_changed := array_append(v_changed, 'subtitle'); END IF;
    IF NEW.body_html IS DISTINCT FROM OLD.body_html THEN v_changed := array_append(v_changed, 'body_html'); END IF;
    IF NEW."order" IS DISTINCT FROM OLD."order" THEN v_changed := array_append(v_changed, 'order'); END IF;

    IF array_length(v_changed, 1) IS NOT NULL THEN
      INSERT INTO public.saint_works_audit(work_id, chapter_id, action, changed_fields, actor_id, actor_email)
      VALUES (NEW.work_id, NEW.id, 'chapter_updated', v_changed, v_actor, v_email);
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.saint_works_audit(work_id, chapter_id, action, changed_fields, actor_id, actor_email)
    VALUES (OLD.work_id, OLD.id, 'chapter_deleted', ARRAY['*'], v_actor, v_email);
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_saint_work_chapters_audit ON public.saint_work_chapters;
CREATE TRIGGER trg_saint_work_chapters_audit
AFTER INSERT OR UPDATE OR DELETE ON public.saint_work_chapters
FOR EACH ROW EXECUTE FUNCTION public.saint_work_chapters_audit_trigger();

-- 5) Full-text search RPC (paginated, with snippet + rank)
CREATE OR REPLACE FUNCTION public.search_patristic_library(
  search_query text,
  page_number int DEFAULT 1,
  page_size int DEFAULT 10
)
RETURNS TABLE (
  work_id uuid,
  work_slug text,
  work_title text,
  saint_id text,
  saint_name text,
  category text,
  year_written int,
  chapter_id uuid,
  chapter_order int,
  chapter_title text,
  snippet text,
  rank real,
  total_count bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_q tsquery;
  v_offset int := GREATEST(0, (COALESCE(page_number,1) - 1)) * GREATEST(1, LEAST(50, COALESCE(page_size,10)));
  v_limit int := GREATEST(1, LEAST(50, COALESCE(page_size,10)));
BEGIN
  IF search_query IS NULL OR length(btrim(search_query)) < 2 THEN
    RETURN;
  END IF;

  v_q := websearch_to_tsquery('portuguese', search_query);
  IF v_q::text = '' THEN
    v_q := plainto_tsquery('portuguese', search_query);
  END IF;

  RETURN QUERY
  WITH matches AS (
    SELECT
      w.id  AS work_id,
      w.slug AS work_slug,
      w.title AS work_title,
      w.saint_id,
      w.category::text AS category,
      w.year_written,
      c.id AS chapter_id,
      c."order" AS chapter_order,
      c.title AS chapter_title,
      c.body_plain AS body,
      ts_rank(to_tsvector('portuguese', c.body_plain), v_q) AS rank
    FROM public.saint_work_chapters c
    JOIN public.saint_works w ON w.id = c.work_id
    WHERE w.status = 'published'
      AND to_tsvector('portuguese', c.body_plain) @@ v_q

    UNION ALL

    SELECT
      w.id, w.slug, w.title, w.saint_id, w.category::text, w.year_written,
      NULL::uuid, NULL::int, NULL::text,
      coalesce(w.abstract,'') || ' ' || w.title || ' ' || coalesce(w.original_title,'') AS body,
      ts_rank(to_tsvector('portuguese',
        coalesce(w.abstract,'') || ' ' || w.title || ' ' || coalesce(w.original_title,'')
      ), v_q) * 1.5 AS rank
    FROM public.saint_works w
    WHERE w.status = 'published'
      AND to_tsvector('portuguese',
        coalesce(w.abstract,'') || ' ' || w.title || ' ' || coalesce(w.original_title,'')
      ) @@ v_q
  ),
  counted AS (SELECT count(*)::bigint AS total FROM matches)
  SELECT
    m.work_id, m.work_slug, m.work_title, m.saint_id,
    s.name AS saint_name,
    m.category, m.year_written,
    m.chapter_id, m.chapter_order, m.chapter_title,
    ts_headline('portuguese', m.body, v_q,
      'MaxWords=28, MinWords=12, ShortWord=3, MaxFragments=2, FragmentDelimiter=" … ", StartSel=<mark>, StopSel=</mark>'
    ) AS snippet,
    m.rank,
    (SELECT total FROM counted) AS total_count
  FROM matches m
  LEFT JOIN public.saints s ON s.id = m.saint_id
  ORDER BY m.rank DESC, m.work_title
  LIMIT v_limit OFFSET v_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_patristic_library(text, int, int) TO anon, authenticated;
