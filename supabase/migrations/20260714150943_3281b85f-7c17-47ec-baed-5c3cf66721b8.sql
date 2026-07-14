
-- Habilita pg_cron e pg_net (idempotente)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Segredo interno usado pelo cron para chamar a edge function
INSERT INTO public._migration_env(key, value)
VALUES ('saints_cron_secret', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (key) DO NOTHING;

-- Tabela de runs
CREATE TABLE IF NOT EXISTS public.saints_reimport_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'cron' CHECK (source IN ('cron','manual')),
  status text NOT NULL DEFAULT 'pending_approval'
    CHECK (status IN ('pending_approval','applied','rejected','failed')),
  ttl_days integer NOT NULL DEFAULT 30,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  preview jsonb NOT NULL DEFAULT '[]'::jsonb,
  approved_by uuid,
  approved_at timestamptz,
  applied_summary jsonb,
  error text
);

GRANT SELECT, UPDATE ON public.saints_reimport_runs TO authenticated;
GRANT ALL ON public.saints_reimport_runs TO service_role;

ALTER TABLE public.saints_reimport_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_read_saints_reimport_runs" ON public.saints_reimport_runs;
CREATE POLICY "admins_read_saints_reimport_runs"
ON public.saints_reimport_runs FOR SELECT TO authenticated
USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "admins_update_saints_reimport_runs" ON public.saints_reimport_runs;
CREATE POLICY "admins_update_saints_reimport_runs"
ON public.saints_reimport_runs FOR UPDATE TO authenticated
USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_saints_reimport_runs_created_at
  ON public.saints_reimport_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saints_reimport_runs_status
  ON public.saints_reimport_runs(status);

-- Remove job anterior se existir
DO $$
DECLARE jid bigint;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'saints_daily_dry_run_reimport';
  IF jid IS NOT NULL THEN PERFORM cron.unschedule(jid); END IF;
END $$;

-- Agenda cron diário às 03:00 UTC
SELECT cron.schedule(
  'saints_daily_dry_run_reimport',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://gpwrpmoniglarqwfyryp.supabase.co/functions/v1/admin-incremental-reimport-saints',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Cron-Secret', (SELECT value FROM public._migration_env WHERE key = 'saints_cron_secret')
    ),
    body := jsonb_build_object('dry_run', true, 'persist', true, 'ttl_days', 30, 'limit', 100, 'source', 'cron')
  );
  $$
);
