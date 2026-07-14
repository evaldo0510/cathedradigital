
CREATE OR REPLACE FUNCTION public.pg_stat_notif_backoff(p_attempts integer)
RETURNS interval
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_base_seconds numeric;
  v_jitter numeric;
BEGIN
  v_base_seconds := LEAST(3600, 30 * power(2, GREATEST(p_attempts, 0)));
  v_jitter := 0.75 + (random() * 0.5);
  RETURN make_interval(secs => (v_base_seconds * v_jitter)::double precision);
END;
$$;

CREATE OR REPLACE FUNCTION public.pg_stat_notif_is_retryable(p_status_code integer)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT
    p_status_code IS NULL
    OR p_status_code IN (408, 425, 429)
    OR (p_status_code >= 500 AND p_status_code < 600);
$$;
