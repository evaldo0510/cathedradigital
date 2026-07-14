
CREATE OR REPLACE FUNCTION public.pg_stat_notif_backoff(p_attempts integer)
RETURNS interval
LANGUAGE plpgsql
VOLATILE
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
