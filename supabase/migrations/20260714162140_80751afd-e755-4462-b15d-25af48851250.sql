
CREATE TABLE public.pg_stats_admin_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  config jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pg_stats_admin_views TO authenticated;
GRANT ALL ON public.pg_stats_admin_views TO service_role;

ALTER TABLE public.pg_stats_admin_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage own views"
  ON public.pg_stats_admin_views FOR ALL
  TO authenticated
  USING (auth.uid() = user_id AND public.is_current_user_admin())
  WITH CHECK (auth.uid() = user_id AND public.is_current_user_admin());

CREATE TRIGGER trg_pg_stats_admin_views_updated
  BEFORE UPDATE ON public.pg_stats_admin_views
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.pg_stat_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  taken_at timestamptz NOT NULL DEFAULT now(),
  taken_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  label text,
  note text,
  window_started_at timestamptz,
  window_seconds numeric,
  total_calls bigint,
  total_exec_ms numeric,
  row_count integer,
  rows jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pg_stat_snapshots TO authenticated;
GRANT ALL ON public.pg_stat_snapshots TO service_role;

ALTER TABLE public.pg_stat_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage snapshots"
  ON public.pg_stat_snapshots FOR ALL
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE INDEX idx_pg_stat_snapshots_taken_at ON public.pg_stat_snapshots (taken_at DESC);

CREATE OR REPLACE FUNCTION public.admin_capture_pg_stat_snapshot(
  p_label text DEFAULT NULL,
  p_note text DEFAULT NULL,
  p_limit integer DEFAULT 200
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_id uuid;
  v_rows jsonb;
  v_total_calls bigint;
  v_total_ms numeric;
  v_row_count integer;
  v_window_start timestamptz;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT stats_reset INTO v_window_start
  FROM extensions.pg_stat_statements_info
  LIMIT 1;

  SELECT
    jsonb_agg(row_to_json(t) ORDER BY t.total_exec_time DESC),
    COALESCE(SUM(t.calls), 0),
    COALESCE(SUM(t.total_exec_time), 0),
    COUNT(*)
  INTO v_rows, v_total_calls, v_total_ms, v_row_count
  FROM (
    SELECT
      s.query,
      s.calls,
      s.total_exec_time,
      s.mean_exec_time,
      s.max_exec_time,
      s.min_exec_time,
      s.stddev_exec_time,
      s.rows AS rows_returned,
      s.shared_blks_hit,
      s.shared_blks_read
    FROM extensions.pg_stat_statements s
    JOIN pg_database d ON d.oid = s.dbid
    WHERE d.datname = current_database()
      AND s.query !~* '^(BEGIN|COMMIT|ROLLBACK|SET |SHOW |DEALLOCATE|DISCARD|COPY |VACUUM|ANALYZE)'
      AND s.query !~* 'pg_stat_statements|pg_catalog|information_schema'
    ORDER BY s.total_exec_time DESC
    LIMIT p_limit
  ) t;

  INSERT INTO public.pg_stat_snapshots
    (taken_by, label, note, window_started_at, window_seconds,
     total_calls, total_exec_ms, row_count, rows)
  VALUES
    (auth.uid(), p_label, p_note, v_window_start,
     CASE WHEN v_window_start IS NULL THEN NULL
          ELSE EXTRACT(EPOCH FROM (now() - v_window_start)) END,
     v_total_calls, v_total_ms, v_row_count, COALESCE(v_rows, '[]'::jsonb))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_capture_pg_stat_snapshot(text, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_capture_pg_stat_snapshot(text, text, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_explain_query(
  p_query text,
  p_analyze boolean DEFAULT false
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sql text;
  v_out text;
  v_line text;
  v_trim text;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF p_query IS NULL OR btrim(p_query) = '' THEN
    RAISE EXCEPTION 'empty query';
  END IF;

  v_trim := btrim(p_query);
  WHILE right(v_trim, 1) = ';' LOOP
    v_trim := btrim(left(v_trim, length(v_trim) - 1));
  END LOOP;

  IF v_trim !~* '^(SELECT|WITH)\s' THEN
    RAISE EXCEPTION 'only SELECT/WITH queries are allowed';
  END IF;

  IF v_trim ~* '\y(INSERT|UPDATE|DELETE|MERGE|TRUNCATE|DROP|ALTER|GRANT|REVOKE|COPY|VACUUM|REINDEX|CLUSTER|CALL|DO)\y' THEN
    RAISE EXCEPTION 'destructive/DDL keywords not permitted';
  END IF;

  IF v_trim ~ '\$\d+' THEN
    RAISE EXCEPTION 'query still contains bind placeholders ($1...); substitute literal sample values before running EXPLAIN';
  END IF;

  IF p_analyze THEN
    v_sql := 'EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT TEXT) ' || v_trim;
  ELSE
    v_sql := 'EXPLAIN (VERBOSE, FORMAT TEXT) ' || v_trim;
  END IF;

  v_out := '';
  FOR v_line IN EXECUTE v_sql LOOP
    v_out := v_out || v_line || E'\n';
  END LOOP;

  RETURN v_out;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_explain_query(text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_explain_query(text, boolean) TO authenticated;
