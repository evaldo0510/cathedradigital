-- Fix search path and restrict execution
ALTER FUNCTION public.get_pending_webhook_retries() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.get_pending_webhook_retries() FROM public;
REVOKE EXECUTE ON FUNCTION public.get_pending_webhook_retries() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_webhook_retries() TO service_role;

-- Do the same for track_webhook_alert if it's security definer
ALTER FUNCTION public.track_webhook_alert(text, text) SET search_path = public;
