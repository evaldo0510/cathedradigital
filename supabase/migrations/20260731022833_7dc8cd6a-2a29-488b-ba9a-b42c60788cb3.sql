-- 1) Defense in depth: revoke residual anon privileges on admin-only tables
DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
    WHERE c.relkind = 'r'
      AND c.relname ~ 'secret|leak|security|audit|log|private|sensitive'
      AND has_table_privilege('anon', c.oid, 'SELECT')
      AND NOT EXISTS (
        SELECT 1 FROM pg_policy p
        WHERE p.polrelid = c.oid
          AND (p.polroles = '{0}'::oid[] OR 'anon' = ANY (SELECT rolname FROM pg_roles WHERE oid = ANY (p.polroles)))
      )
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
  END LOOP;
END $$;

-- 2) Denial audit trail
CREATE TABLE IF NOT EXISTS public.rls_denial_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  table_name text NOT NULL,
  action text NOT NULL,
  reason text,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.rls_denial_events TO authenticated;
GRANT ALL ON public.rls_denial_events TO service_role;

ALTER TABLE public.rls_denial_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view denial events" ON public.rls_denial_events;
CREATE POLICY "Admins can view denial events"
  ON public.rls_denial_events FOR SELECT TO authenticated
  USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_rls_denial_events_created_at
  ON public.rls_denial_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rls_denial_events_table
  ON public.rls_denial_events (table_name, created_at DESC);

-- 3) Controlled writer (clients cannot INSERT directly)
CREATE OR REPLACE FUNCTION public.log_rls_denial(
  p_table text,
  p_action text,
  p_reason text DEFAULT NULL,
  p_context jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_table IS NULL OR length(p_table) > 128
     OR p_action IS NULL OR length(p_action) > 32 THEN
    RAISE EXCEPTION 'invalid denial payload';
  END IF;

  INSERT INTO public.rls_denial_events (user_id, table_name, action, reason, context)
  VALUES (
    auth.uid(),
    left(p_table, 128),
    left(p_action, 32),
    left(coalesce(p_reason, ''), 500),
    coalesce(p_context, '{}'::jsonb)
  );
END $$;

REVOKE ALL ON FUNCTION public.log_rls_denial(text, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_rls_denial(text, text, text, jsonb) TO authenticated, service_role;