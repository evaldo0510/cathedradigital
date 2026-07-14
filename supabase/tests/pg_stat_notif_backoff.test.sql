-- =====================================================================
-- Unit tests for pg_stat_notif_backoff() and pg_stat_notif_is_retryable()
-- Run via supabase--read_query or psql. Each SELECT returns pass=true.
-- =====================================================================

-- 1) Retryability classifier
SELECT
  'is_retryable(NULL) = true (network error)' AS test,
  public.pg_stat_notif_is_retryable(NULL) = true AS pass;

SELECT 'is_retryable(200) = false' AS test,
  public.pg_stat_notif_is_retryable(200) = false AS pass;

SELECT 'is_retryable(400) = false (bad request, non-retryable)' AS test,
  public.pg_stat_notif_is_retryable(400) = false AS pass;

SELECT 'is_retryable(401) = false' AS test,
  public.pg_stat_notif_is_retryable(401) = false AS pass;

SELECT 'is_retryable(404) = false' AS test,
  public.pg_stat_notif_is_retryable(404) = false AS pass;

SELECT 'is_retryable(408) = true (request timeout)' AS test,
  public.pg_stat_notif_is_retryable(408) = true AS pass;

SELECT 'is_retryable(425) = true (too early)' AS test,
  public.pg_stat_notif_is_retryable(425) = true AS pass;

SELECT 'is_retryable(429) = true (rate limit)' AS test,
  public.pg_stat_notif_is_retryable(429) = true AS pass;

SELECT 'is_retryable(500) = true' AS test,
  public.pg_stat_notif_is_retryable(500) = true AS pass;

SELECT 'is_retryable(503) = true' AS test,
  public.pg_stat_notif_is_retryable(503) = true AS pass;

SELECT 'is_retryable(599) = true (last of 5xx)' AS test,
  public.pg_stat_notif_is_retryable(599) = true AS pass;

SELECT 'is_retryable(600) = false (out of 5xx range)' AS test,
  public.pg_stat_notif_is_retryable(600) = false AS pass;

-- 2) Backoff bounds: sample many jitter draws and confirm bracket
WITH samples AS (
  SELECT EXTRACT(EPOCH FROM public.pg_stat_notif_backoff(0)) AS s
  FROM generate_series(1, 200)
)
SELECT
  'backoff(0) within [22.5s, 37.5s]' AS test,
  min(s) >= 30 * 0.75 AND max(s) <= 30 * 1.25 AS pass
FROM samples;

WITH samples AS (
  SELECT EXTRACT(EPOCH FROM public.pg_stat_notif_backoff(3)) AS s
  FROM generate_series(1, 200)
)
SELECT
  'backoff(3) within [180s, 300s] (base 240s ±25%)' AS test,
  min(s) >= 30 * 8 * 0.75 AND max(s) <= 30 * 8 * 1.25 AS pass
FROM samples;

WITH samples AS (
  SELECT EXTRACT(EPOCH FROM public.pg_stat_notif_backoff(20)) AS s
  FROM generate_series(1, 200)
)
SELECT
  'backoff(20) capped at 3600s ±25% => max <= 4500s' AS test,
  min(s) >= 3600 * 0.75 AND max(s) <= 3600 * 1.25 AS pass
FROM samples;

-- 3) Jitter actually varies (not constant)
WITH samples AS (
  SELECT EXTRACT(EPOCH FROM public.pg_stat_notif_backoff(2)) AS s
  FROM generate_series(1, 50)
)
SELECT
  'backoff(2) produces >5 distinct values (jitter present)' AS test,
  COUNT(DISTINCT s) > 5 AS pass
FROM samples;

-- 4) Monotonic growth (mean) between low and high attempts
WITH a AS (
  SELECT AVG(EXTRACT(EPOCH FROM public.pg_stat_notif_backoff(0))) AS m
  FROM generate_series(1, 100)
), b AS (
  SELECT AVG(EXTRACT(EPOCH FROM public.pg_stat_notif_backoff(5))) AS m
  FROM generate_series(1, 100)
)
SELECT
  'mean backoff(5) > mean backoff(0)' AS test,
  (SELECT m FROM b) > (SELECT m FROM a) AS pass;
