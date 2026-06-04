-- Fix security warnings for track_webhook_alert
ALTER FUNCTION public.track_webhook_alert(TEXT, TEXT, TEXT) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.track_webhook_alert(TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.track_webhook_alert(TEXT, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.track_webhook_alert(TEXT, TEXT, TEXT) TO service_role;

-- Fix security warnings for get_pending_webhook_retries
ALTER FUNCTION public.get_pending_webhook_retries() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.get_pending_webhook_retries() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_pending_webhook_retries() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_webhook_retries() TO service_role;
