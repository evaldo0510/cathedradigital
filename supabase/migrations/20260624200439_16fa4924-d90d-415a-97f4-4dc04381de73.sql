REVOKE EXECUTE ON FUNCTION public.aggregate_bible_cache_metrics(INTERVAL) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.aggregate_bible_cache_metrics(INTERVAL) TO service_role;