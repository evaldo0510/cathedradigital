
CREATE TABLE public.cid_compliance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  commit_sha TEXT,
  branch TEXT,
  total_functions INTEGER NOT NULL,
  coverage_ratio NUMERIC(6,4) NOT NULL,
  coverage_pct TEXT NOT NULL,
  cid_counts JSONB NOT NULL,
  validation_counts JSONB NOT NULL,
  http_counts JSONB NOT NULL,
  test_counts JSONB NOT NULL,
  by_category JSONB NOT NULL,
  failing_functions JSONB NOT NULL DEFAULT '[]'::jsonb,
  passed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.cid_compliance_snapshots TO authenticated;
GRANT ALL ON public.cid_compliance_snapshots TO service_role;

ALTER TABLE public.cid_compliance_snapshots ENABLE ROW LEVEL SECURITY;

-- Leitura: apenas admins autenticados
CREATE POLICY "cid_compliance_snapshots_admin_select"
  ON public.cid_compliance_snapshots
  FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());

-- Escrita: apenas service_role (CI). Nenhuma policy para authenticated → bloqueado.
CREATE POLICY "cid_compliance_snapshots_service_write"
  ON public.cid_compliance_snapshots
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_cid_compliance_snapshots_captured_at
  ON public.cid_compliance_snapshots (captured_at DESC);
