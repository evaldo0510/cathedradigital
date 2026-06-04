REVOKE EXECUTE ON FUNCTION public.track_webhook_alert(text, text, text) FROM public;
REVOKE EXECUTE ON FUNCTION public.track_webhook_alert(text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.track_webhook_alert(text, text, text) TO service_role;
