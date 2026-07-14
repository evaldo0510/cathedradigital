
-- Sprint B2: revogar EXECUTE indevido em funções SECURITY DEFINER

-- Trigger functions: só o engine chama; nenhum cliente precisa acesso
REVOKE EXECUTE ON FUNCTION public.enforce_bible_source_sprint1_gate() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_pcl_active_requires_admin() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.saints_audit_trg() FROM anon, authenticated, PUBLIC;

-- Auditoria: protegida por guard admin, mas revogar de anon reduz superfície
REVOKE EXECUTE ON FUNCTION public.get_correlation_trail(text, boolean) FROM anon, PUBLIC;
