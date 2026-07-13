-- Sprint 1.14 / M1: Read-only administrative helpers for PCL panel.
-- Both functions are SECURITY DEFINER with explicit is_current_user_admin() guard.
-- No schema changes on bible_translation_sources.

CREATE OR REPLACE FUNCTION public.admin_list_translation_sources(
  p_search      TEXT    DEFAULT NULL,
  p_pcl_status  TEXT    DEFAULT NULL,
  p_limit       INTEGER DEFAULT 50,
  p_offset      INTEGER DEFAULT 0
)
RETURNS TABLE (
  id                 UUID,
  code               TEXT,
  name               TEXT,
  author             TEXT,
  year_published     INTEGER,
  provider           TEXT,
  language           TEXT,
  status             TEXT,
  pcl_status         TEXT,
  is_primary         BOOLEAN,
  pcl_activated_by   UUID,
  pcl_activated_at   TIMESTAMPTZ,
  certified_at       TIMESTAMPTZ,
  imported_at        TIMESTAMPTZ,
  updated_at         TIMESTAMPTZ,
  total_count        BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_limit  INTEGER := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 200);
  v_offset INTEGER := GREATEST(COALESCE(p_offset, 0), 0);
  v_search TEXT    := NULLIF(TRIM(COALESCE(p_search, '')), '');
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  IF p_pcl_status IS NOT NULL AND p_pcl_status NOT IN
     ('draft','submitted','validated','approved','active','suspended','revoked','expired') THEN
    RAISE EXCEPTION 'invalid pcl_status filter: %', p_pcl_status USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  WITH filtered AS (
    SELECT s.*
    FROM public.bible_translation_sources s
    WHERE (p_pcl_status IS NULL OR s.pcl_status = p_pcl_status)
      AND (
        v_search IS NULL
        OR s.code ILIKE '%' || v_search || '%'
        OR s.name ILIKE '%' || v_search || '%'
        OR COALESCE(s.author, '') ILIKE '%' || v_search || '%'
      )
  ),
  counted AS (
    SELECT COUNT(*)::BIGINT AS total_count FROM filtered
  )
  SELECT
    f.id, f.code, f.name, f.author, f.year_published, f.provider, f.language,
    f.status, f.pcl_status, f.is_primary, f.pcl_activated_by, f.pcl_activated_at,
    f.certified_at, f.imported_at, f.updated_at,
    c.total_count
  FROM filtered f
  CROSS JOIN counted c
  ORDER BY f.is_primary DESC, f.updated_at DESC
  LIMIT v_limit
  OFFSET v_offset;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_list_translation_sources(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_translation_sources(TEXT, TEXT, INTEGER, INTEGER) TO authenticated, service_role;


CREATE OR REPLACE FUNCTION public.admin_pcl_kpis()
RETURNS TABLE (
  pcl_status TEXT,
  total      BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH states(pcl_status) AS (
    VALUES ('draft'),('submitted'),('validated'),('approved'),
           ('active'),('suspended'),('revoked'),('expired')
  )
  SELECT st.pcl_status,
         COALESCE(COUNT(s.id), 0)::BIGINT AS total
  FROM states st
  LEFT JOIN public.bible_translation_sources s
    ON s.pcl_status = st.pcl_status
  GROUP BY st.pcl_status
  ORDER BY
    CASE st.pcl_status
      WHEN 'draft'     THEN 1
      WHEN 'submitted' THEN 2
      WHEN 'validated' THEN 3
      WHEN 'approved'  THEN 4
      WHEN 'active'    THEN 5
      WHEN 'suspended' THEN 6
      WHEN 'revoked'   THEN 7
      WHEN 'expired'   THEN 8
    END;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_pcl_kpis() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_pcl_kpis() TO authenticated, service_role;