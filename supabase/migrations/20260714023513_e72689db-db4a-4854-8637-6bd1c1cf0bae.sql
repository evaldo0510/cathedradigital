-- Sprint B / B2 — Endurecimento SECURITY DEFINER
-- cleanup_bible_audit_action_logs: revoga EXECUTE de anon/authenticated/PUBLIC.
-- A função continua acessível a service_role (cron) — admins logados via RPC
-- também precisam de EXECUTE; portanto mantemos authenticated apenas se
-- necessário. Regra interna já bloqueia não-admin, mas seguir princípio de
-- menor privilégio: apenas service_role.

REVOKE EXECUTE ON FUNCTION public.cleanup_bible_audit_action_logs(text, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_bible_audit_action_logs(text, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_bible_audit_action_logs(text, integer) FROM authenticated;
-- Garante que service_role permaneça com acesso (idempotente)
GRANT EXECUTE ON FUNCTION public.cleanup_bible_audit_action_logs(text, integer) TO service_role;