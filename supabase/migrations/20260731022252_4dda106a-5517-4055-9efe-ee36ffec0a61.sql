-- 1. community_likes: restringir leitura ao próprio usuário
DROP POLICY IF EXISTS "Anyone authenticated can read likes" ON public.community_likes;
CREATE POLICY "Users can read own likes"
ON public.community_likes FOR SELECT TO authenticated
USING (auth.uid() = user_id OR auth_internal.is_admin());

-- 2. Realtime: remover tabelas admin-only da publicação
ALTER PUBLICATION supabase_realtime DROP TABLE public.bible_cache_alerts;
ALTER PUBLICATION supabase_realtime DROP TABLE public.editorial_closure_migration_log;

-- 3. secret_leaks: coluna real verificada
ALTER TABLE public.secret_leaks ADD COLUMN IF NOT EXISTS user_id uuid;
UPDATE public.secret_leaks
   SET user_id = NULLIF(details->>'user_id','')::uuid
 WHERE user_id IS NULL
   AND details ? 'user_id'
   AND NULLIF(details->>'user_id','') ~ '^[0-9a-fA-F-]{36}$';

DROP POLICY IF EXISTS "Users can view their own leaks" ON public.secret_leaks;
CREATE POLICY "Owners or admins can view leaks"
ON public.secret_leaks FOR SELECT TO authenticated
USING (
  auth_internal.has_role(auth.uid(), 'admin'::app_role)
  OR (user_id IS NOT NULL AND user_id = auth.uid())
);

REVOKE ALL ON public.secret_leaks FROM anon, authenticated;
GRANT SELECT ON public.secret_leaks TO authenticated;
GRANT ALL ON public.secret_leaks TO service_role;

-- 4. SECURITY DEFINER: revogar EXECUTE indevido
-- 4a. Trigger functions: somente o engine executa
REVOKE ALL ON FUNCTION public._glossary_enforce_quality_gate() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_editorial_publish() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_phase_certification_gate() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_primary_translation_integrity() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.log_partner_change() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.saint_work_chapters_audit_trigger() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.saint_works_audit_trigger() FROM anon, authenticated, PUBLIC;

-- 4b. Helpers internos e harness de teste: apenas service_role
REVOKE ALL ON FUNCTION public._current_actor_email() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public._test_notif_concurrency_cleanup() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public._test_notif_concurrency_seed(integer, numeric) FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public._test_notif_concurrency_verify() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public._test_notif_limits_cleanup(text) FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public._test_notif_limits_seed(text, text, integer, numeric, integer) FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public._test_notif_limits_verify(text, integer) FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public._test_notif_retry_snapshot_row(uuid) FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public._test_notif_retry_snapshots() FROM anon, authenticated, PUBLIC;

-- 4c. RPCs administrativas: apenas usuários autenticados (guard interno de admin já existe)
REVOKE ALL ON FUNCTION public.admin_notif_failures_report(timestamptz, timestamptz, text, text) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.approve_nexus_contribution(uuid, text) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.reject_nexus_contribution(uuid, text) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.migrate_editorial_closure_legacy(boolean, text[], text[], timestamptz, uuid) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.rollback_editorial_closure_migration(uuid) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.run_saints_enrichment_heuristic(integer) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.saints_advance_editorial_stage(text, editorial_status_enum, text) FROM anon, PUBLIC;

-- 4d. run_saints_enrichment_heuristic: fechar bypass quando não há sessão
CREATE OR REPLACE FUNCTION public.run_saints_enrichment_heuristic(p_limit integer DEFAULT 500)
RETURNS public.saints_enrichment_runs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_run public.saints_enrichment_runs;
BEGIN
  IF auth.uid() IS NULL OR NOT auth_internal.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_run FROM public._run_saints_enrichment_heuristic_impl(p_limit);
  RETURN v_run;
END;
$fn$;