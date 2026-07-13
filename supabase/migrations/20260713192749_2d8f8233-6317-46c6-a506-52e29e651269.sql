-- ============================================================
-- Sprint 1.13 — M1/4
-- Tabela principal de auditoria de governança (append-only)
-- Referências: ADR-008, PLANO-SPRINT-1.13
-- ============================================================

CREATE TABLE public.governance_audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role      TEXT NOT NULL DEFAULT 'system'
                    CHECK (actor_role IN ('authenticated','service_role','system','anon')),
  entity_type     TEXT NOT NULL
                    CHECK (entity_type IN ('nexus_relation','translation_source')),
  entity_id       UUID NOT NULL,
  operation       TEXT NOT NULL
                    CHECK (operation IN (
                      'INSERT','UPDATE','DELETE',
                      'PCL_ACTIVATED','PCL_SUSPENDED','PCL_REVOKED','PCL_EXPIRED'
                    )),
  before_state    JSONB,
  after_state     JSONB,
  diff            JSONB,
  correlation_id  TEXT,
  request_ip      INET,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.governance_audit_log IS
  'Trilha de auditoria imutável (append-only) para eventos de governança '
  'do Cathedra: mutações em nexus_relations e transições PCL em '
  'bible_translation_sources. Escrita EXCLUSIVAMENTE por triggers SECURITY '
  'DEFINER. Ver ADR-008.';

-- ============================================================
-- Índices otimizados
-- ============================================================

-- Histórico de uma entidade
CREATE INDEX idx_gov_audit_entity
  ON public.governance_audit_log (entity_type, entity_id, occurred_at DESC);

-- Ações por autor
CREATE INDEX idx_gov_audit_actor
  ON public.governance_audit_log (actor_id, occurred_at DESC)
  WHERE actor_id IS NOT NULL;

-- Ciclo PCL (parcial)
CREATE INDEX idx_gov_audit_pcl_lifecycle
  ON public.governance_audit_log (operation, occurred_at DESC)
  WHERE operation IN ('PCL_ACTIVATED','PCL_SUSPENDED','PCL_REVOKED','PCL_EXPIRED');

-- Retenção / arquivamento
CREATE INDEX idx_gov_audit_occurred_at
  ON public.governance_audit_log (occurred_at);

-- Correlação com Edge Functions
CREATE INDEX idx_gov_audit_correlation
  ON public.governance_audit_log (correlation_id)
  WHERE correlation_id IS NOT NULL;

-- ============================================================
-- GRANTs — INVARIANTE I1 (append-only): apenas SELECT p/ authenticated
-- Escrita exclusiva por service_role (triggers SECURITY DEFINER)
-- ============================================================

GRANT SELECT ON public.governance_audit_log TO authenticated;
GRANT ALL    ON public.governance_audit_log TO service_role;
-- SEM grants para anon
-- SEM INSERT/UPDATE/DELETE para authenticated → imutabilidade garantida

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.governance_audit_log ENABLE ROW LEVEL SECURITY;

-- Admin: leitura total
CREATE POLICY "gov_audit_admin_read_all"
  ON public.governance_audit_log
  FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());

-- Usuário: leitura apenas dos próprios eventos
CREATE POLICY "gov_audit_self_read_own"
  ON public.governance_audit_log
  FOR SELECT
  TO authenticated
  USING (actor_id = auth.uid());

-- Nenhuma policy INSERT/UPDATE/DELETE para authenticated.
-- Ausência de policy + GRANT restrito = imutabilidade forense (ADR-008 I1).