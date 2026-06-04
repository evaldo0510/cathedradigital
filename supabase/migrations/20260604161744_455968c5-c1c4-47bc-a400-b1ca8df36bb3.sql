-- Fix track_webhook_alert
ALTER FUNCTION public.track_webhook_alert(TEXT, TEXT) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.track_webhook_alert(TEXT, TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.track_webhook_alert(TEXT, TEXT) TO service_role, authenticated;

-- Fix get_pending_webhook_retries
ALTER FUNCTION public.get_pending_webhook_retries() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.get_pending_webhook_retries() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_pending_webhook_retries() TO service_role, authenticated;
