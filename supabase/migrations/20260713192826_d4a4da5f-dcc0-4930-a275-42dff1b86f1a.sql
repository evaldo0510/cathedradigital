-- ============================================================
-- Sprint 1.13 — M2/4
-- Arquivamento e configuração de retenção
-- ============================================================

-- ------------------------------------------------------------
-- 1) Arquivo (append-only, mesmas invariantes da tabela viva)
-- ------------------------------------------------------------

CREATE TABLE public.governance_audit_log_archive (
  id              UUID PRIMARY KEY,
  occurred_at     TIMESTAMPTZ NOT NULL,
  actor_id        UUID,
  actor_role      TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       UUID NOT NULL,
  operation       TEXT NOT NULL,
  before_state    JSONB,
  after_state     JSONB,
  diff            JSONB,
  correlation_id  TEXT,
  request_ip      INET,
  created_at      TIMESTAMPTZ NOT NULL,
  archived_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.governance_audit_log_archive IS
  'Arquivo de logs de governança > 365 dias. Somente admins consultam. '
  'Escrita exclusiva por fn_archive_governance_audit (service_role).';

CREATE INDEX idx_gov_audit_archive_occurred_at
  ON public.governance_audit_log_archive (occurred_at);

CREATE INDEX idx_gov_audit_archive_entity
  ON public.governance_audit_log_archive (entity_type, entity_id);

GRANT SELECT ON public.governance_audit_log_archive TO authenticated;
GRANT ALL    ON public.governance_audit_log_archive TO service_role;

ALTER TABLE public.governance_audit_log_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gov_audit_archive_admin_read"
  ON public.governance_audit_log_archive
  FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());

-- ------------------------------------------------------------
-- 2) Configuração de retenção (singleton)
-- ------------------------------------------------------------

CREATE TABLE public.governance_audit_retention_config (
  id                    BOOLEAN PRIMARY KEY DEFAULT true CHECK (id = true),
  retention_days        INTEGER NOT NULL DEFAULT 365 CHECK (retention_days >= 30),
  auto_archive_enabled  BOOLEAN NOT NULL DEFAULT true,
  updated_by            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.governance_audit_retention_config IS
  'Configuração singleton de retenção da auditoria de governança. '
  'Padrão: 365 dias + arquivamento automático (aprovação usuário 13/07/2026).';

-- Semear singleton
INSERT INTO public.governance_audit_retention_config (id, retention_days, auto_archive_enabled)
VALUES (true, 365, true)
ON CONFLICT (id) DO NOTHING;

GRANT SELECT ON public.governance_audit_retention_config TO authenticated;
GRANT ALL    ON public.governance_audit_retention_config TO service_role;

ALTER TABLE public.governance_audit_retention_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gov_audit_config_admin_read"
  ON public.governance_audit_retention_config
  FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());

CREATE POLICY "gov_audit_config_admin_update"
  ON public.governance_audit_retention_config
  FOR UPDATE
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- ------------------------------------------------------------
-- 3) Histórico de execuções do arquivamento
-- ------------------------------------------------------------

CREATE TABLE public.governance_audit_log_cleanup_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by    TEXT NOT NULL CHECK (triggered_by IN ('cron','admin')),
  triggered_user  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  retention_days  INTEGER NOT NULL,
  rows_archived   INTEGER NOT NULL DEFAULT 0,
  duration_ms     INTEGER,
  status          TEXT NOT NULL CHECK (status IN ('ok','skipped','error')),
  error           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.governance_audit_log_cleanup_runs IS
  'Histórico de execuções da rotina fn_archive_governance_audit.';

CREATE INDEX idx_gov_audit_cleanup_runs_created
  ON public.governance_audit_log_cleanup_runs (created_at DESC);

GRANT SELECT ON public.governance_audit_log_cleanup_runs TO authenticated;
GRANT ALL    ON public.governance_audit_log_cleanup_runs TO service_role;

ALTER TABLE public.governance_audit_log_cleanup_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gov_audit_cleanup_admin_read"
  ON public.governance_audit_log_cleanup_runs
  FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());