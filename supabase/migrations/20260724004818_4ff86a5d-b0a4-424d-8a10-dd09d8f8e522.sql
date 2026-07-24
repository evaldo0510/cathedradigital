
CREATE TABLE IF NOT EXISTS public.catechism_import_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paragraph integer NOT NULL UNIQUE CHECK (paragraph >= 1 AND paragraph <= 2865),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','done','failed')),
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.catechism_import_queue TO authenticated;
GRANT ALL ON public.catechism_import_queue TO service_role;

ALTER TABLE public.catechism_import_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read queue"
  ON public.catechism_import_queue FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can enqueue"
  ON public.catechism_import_queue FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update queue"
  ON public.catechism_import_queue FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role::text = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role::text = 'admin'));

CREATE INDEX IF NOT EXISTS idx_catechism_import_queue_status
  ON public.catechism_import_queue(status, requested_at);

CREATE TRIGGER trg_catechism_import_queue_updated_at
  BEFORE UPDATE ON public.catechism_import_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
