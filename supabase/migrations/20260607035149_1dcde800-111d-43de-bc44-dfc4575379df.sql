-- 1. bible_audit_alerts: remover política pública
DROP POLICY IF EXISTS "Anyone can view alerts" ON public.bible_audit_alerts;

-- 2. bible_audit_runs: remover políticas permissivas
DROP POLICY IF EXISTS "Anyone can view audit runs" ON public.bible_audit_runs;
DROP POLICY IF EXISTS "Authenticated users can insert audit runs" ON public.bible_audit_runs;

CREATE POLICY "Admins manage bible_audit_runs" ON public.bible_audit_runs
  FOR ALL TO authenticated
  USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));

-- 3. bible_audit_action_logs: remover leitura ampla
DROP POLICY IF EXISTS "Users can view action logs" ON public.bible_audit_action_logs;

-- 4. bible_integrity_reports: restringir a admins
DROP POLICY IF EXISTS "Allow read access to authenticated users for bible_integrity_reports" ON public.bible_integrity_reports;

CREATE POLICY "Admins read bible_integrity_reports" ON public.bible_integrity_reports
  FOR SELECT TO authenticated
  USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage bible_integrity_reports" ON public.bible_integrity_reports
  FOR ALL TO authenticated
  USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));

-- 5. core_audit_logs: restringir a admins
DROP POLICY IF EXISTS "Allow read access to authenticated users for core_audit_logs" ON public.core_audit_logs;

CREATE POLICY "Admins read core_audit_logs" ON public.core_audit_logs
  FOR SELECT TO authenticated
  USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

-- 6. saved_filters: corrigir INSERT para validar user_id
DROP POLICY IF EXISTS "Users can create filters" ON public.saved_filters;

CREATE POLICY "Users can create own filters" ON public.saved_filters
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 7. _migration_env: habilitar RLS + restringir a admins
ALTER TABLE public._migration_env ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins only access _migration_env" ON public._migration_env
  FOR ALL TO authenticated
  USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));

REVOKE ALL ON public._migration_env FROM anon;
REVOKE ALL ON public._migration_env FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public._migration_env TO authenticated;
GRANT ALL ON public._migration_env TO service_role;
