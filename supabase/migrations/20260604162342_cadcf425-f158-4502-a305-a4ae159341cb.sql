-- Restrict execution
REVOKE EXECUTE ON FUNCTION public.track_webhook_alert(text, text) FROM public;
REVOKE EXECUTE ON FUNCTION public.track_webhook_alert(text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.track_webhook_alert(text, text) TO service_role;
