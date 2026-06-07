
DROP POLICY IF EXISTS "Anyone can view alerts" ON public.bible_audit_alerts;
DROP POLICY IF EXISTS "Anyone can view audit runs" ON public.bible_audit_runs;
DROP POLICY IF EXISTS "Authenticated users can insert audit runs" ON public.bible_audit_runs;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='bible_audit_alerts' AND policyname='Admins manage alerts'
  ) THEN
    CREATE POLICY "Admins manage alerts" ON public.bible_audit_alerts
      FOR ALL TO authenticated
      USING (auth_internal.has_role(auth.uid(), 'admin'))
      WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='bible_audit_runs' AND policyname='Admins manage audit runs'
  ) THEN
    CREATE POLICY "Admins manage audit runs" ON public.bible_audit_runs
      FOR ALL TO authenticated
      USING (auth_internal.has_role(auth.uid(), 'admin'))
      WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'));
  END IF;
END $$;
