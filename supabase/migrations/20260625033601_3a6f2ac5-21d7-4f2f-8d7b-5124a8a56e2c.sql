
REVOKE EXECUTE ON FUNCTION public.aggregate_bible_cache_metrics(interval) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aggregate_bible_cache_metrics(interval) TO service_role;
