REVOKE EXECUTE ON FUNCTION public.notify_admin_on_security_event() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_admin_on_security_event() TO service_role;
