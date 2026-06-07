-- Proteção das novas funções de alerta
ALTER FUNCTION public.generate_security_scan_alerts(uuid) SET search_path = public;
REVOKE ALL ON FUNCTION public.generate_security_scan_alerts(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_security_scan_alerts(uuid) TO service_role;

ALTER FUNCTION public.tr_after_security_scan_complete() SET search_path = public;
REVOKE ALL ON FUNCTION public.tr_after_security_scan_complete() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tr_after_security_scan_complete() TO service_role;
