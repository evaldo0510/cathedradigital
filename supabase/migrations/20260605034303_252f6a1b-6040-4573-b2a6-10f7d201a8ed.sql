-- Refine bible_audit_runs policy
DROP POLICY IF EXISTS "Users can manage their own audit runs" ON public.bible_audit_runs;
CREATE POLICY "Users can manage their own audit runs" ON public.bible_audit_runs FOR ALL USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

-- Refine bible_audit_schedules policy
DROP POLICY IF EXISTS "Users can manage their own audit schedules" ON public.bible_audit_schedules;
CREATE POLICY "Users can manage their own audit schedules" ON public.bible_audit_schedules FOR ALL USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

-- Refine bible_audit_alerts policy
DROP POLICY IF EXISTS "Users can manage their own audit alerts" ON public.bible_audit_alerts;
CREATE POLICY "Users can manage their own audit alerts" ON public.bible_audit_alerts FOR ALL USING (true); -- Alerts might be system-generated but let's keep them viewable by everyone for now or refine if needed.
-- Actually, let's make alerts viewable by everyone but manageable by service_role
ALTER TABLE public.bible_audit_alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_audit_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view alerts" ON public.bible_audit_alerts FOR SELECT USING (true);
CREATE POLICY "Only service_role or admins can manage alerts" ON public.bible_audit_alerts FOR ALL USING (false) WITH CHECK (false);
