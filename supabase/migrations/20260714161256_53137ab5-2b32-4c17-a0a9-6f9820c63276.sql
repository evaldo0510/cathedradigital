
-- RPC admin-only para leitura de pg_stat_statements com ranking configurável.
CREATE OR REPLACE FUNCTION public.admin_get_pg_stat_statements(
  p_order_by text DEFAULT 'total_exec_time',
  p_limit int DEFAULT 25,
  p_min_calls int DEFAULT 1
)
RETURNS TABLE (
  query text,
  calls bigint,
  total_exec_ms double precision,
  mean_exec_ms double precision,
  max_exec_ms double precision,
  min_exec_ms double precision,
  stddev_exec_ms double precision,
  rows_returned bigint,
  shared_blks_hit bigint,
  shared_blks_read bigint,
  stats_since timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_is_admin boolean;
  v_order text;
  v_lim int;
  v_min_calls int;
  v_stats_since timestamptz;
BEGIN
  -- Guard: apenas admin
  SELECT public.has_role(auth.uid(), 'admin'::app_role) INTO v_is_admin;
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'forbidden: requires admin role' USING ERRCODE = '42501';
  END IF;

  -- Sanitiza ordenação (whitelist)
  v_order := CASE lower(coalesce(p_order_by, 'total_exec_time'))
    WHEN 'total_exec_time' THEN 'total_exec_time'
    WHEN 'mean_exec_time'  THEN 'mean_exec_time'
    WHEN 'max_exec_time'   THEN 'max_exec_time'
    WHEN 'calls'           THEN 'calls'
    ELSE 'total_exec_time'
  END;

  v_lim := LEAST(GREATEST(coalesce(p_limit, 25), 1), 200);
  v_min_calls := GREATEST(coalesce(p_min_calls, 1), 1);

  -- stats_reset da view (timestamp da última reinicialização)
  SELECT COALESCE(MIN(s.stats_since), now())
    INTO v_stats_since
    FROM extensions.pg_stat_statements_info s;

  RETURN QUERY EXECUTE format($f$
    SELECT
      s.query::text,
      s.calls,
      s.total_exec_time,
      s.mean_exec_time,
      s.max_exec_time,
      s.min_exec_time,
      s.stddev_exec_time,
      s.rows,
      s.shared_blks_hit,
      s.shared_blks_read,
      %L::timestamptz
    FROM extensions.pg_stat_statements s
    JOIN pg_database d ON d.oid = s.dbid
    WHERE d.datname = current_database()
      AND s.calls >= %s
      AND s.query !~* '^(BEGIN|COMMIT|ROLLBACK|SET |SHOW |DEALLOCATE|DISCARD)'
      AND s.query !~* 'pg_stat_statements|pg_catalog\.|information_schema\.'
      AND s.query !~* '\mauth\.|\mstorage\.|\mrealtime\.|\msupabase_functions\.|\mvault\.'
    ORDER BY %I DESC
    LIMIT %s
  $f$, v_stats_since, v_min_calls, v_order, v_lim);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_pg_stat_statements(text, int, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_pg_stat_statements(text, int, int) TO authenticated, service_role;

-- Reset de pg_stat_statements para iniciar nova janela de medição.
CREATE OR REPLACE FUNCTION public.admin_reset_pg_stat_statements()
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT public.has_role(auth.uid(), 'admin'::app_role) INTO v_is_admin;
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'forbidden: requires admin role' USING ERRCODE = '42501';
  END IF;

  PERFORM extensions.pg_stat_statements_reset();
  RETURN now();
END;
$$;

REVOKE ALL ON FUNCTION public.admin_reset_pg_stat_statements() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_reset_pg_stat_statements() TO authenticated, service_role;

COMMENT ON FUNCTION public.admin_get_pg_stat_statements(text, int, int) IS
  'Sprint B3: leitura admin-only do pg_stat_statements com ranking configurável. Guard via has_role. Filtra apenas queries do schema public do banco atual.';
COMMENT ON FUNCTION public.admin_reset_pg_stat_statements() IS
  'Sprint B3: reseta pg_stat_statements para iniciar nova janela de medição. Admin-only.';
