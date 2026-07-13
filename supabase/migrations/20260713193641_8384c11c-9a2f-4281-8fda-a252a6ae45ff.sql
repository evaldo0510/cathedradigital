-- ============================================================
-- Sprint 1.13 — Ajuste
-- capture_governance_audit lê x-correlation-id do header HTTP
-- ============================================================

CREATE OR REPLACE FUNCTION public.capture_governance_audit(
  p_entity_type   TEXT,
  p_entity_id     UUID,
  p_operation     TEXT,
  p_before_state  JSONB,
  p_after_state   JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_actor_id       UUID;
  v_actor_role     TEXT;
  v_correlation_id TEXT;
  v_headers        JSONB;
  v_diff           JSONB;
BEGIN
  BEGIN
    v_actor_id   := auth.uid();
    v_actor_role := COALESCE(current_setting('request.jwt.claim.role', true), 'system');

    -- 1) Preferência: set_config('audit.correlation_id', ...) explícito
    v_correlation_id := NULLIF(current_setting('audit.correlation_id', true), '');

    -- 2) Fallback: header x-correlation-id vindo do PostgREST
    IF v_correlation_id IS NULL THEN
      BEGIN
        v_headers := NULLIF(current_setting('request.headers', true), '')::JSONB;
        IF v_headers IS NOT NULL THEN
          v_correlation_id := NULLIF(v_headers ->> 'x-correlation-id', '');
        END IF;
      EXCEPTION WHEN OTHERS THEN
        v_correlation_id := NULL;
      END;
    END IF;

    IF v_actor_role NOT IN ('authenticated','service_role','system','anon') THEN
      v_actor_role := 'system';
    END IF;

    v_diff := public.jsonb_shallow_diff(p_before_state, p_after_state);

    INSERT INTO public.governance_audit_log (
      actor_id, actor_role, entity_type, entity_id, operation,
      before_state, after_state, diff, correlation_id
    ) VALUES (
      v_actor_id, v_actor_role, p_entity_type, p_entity_id, p_operation,
      p_before_state, p_after_state, v_diff, v_correlation_id
    );
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      INSERT INTO public.security_logs (event_type, resource, action, details)
      VALUES (
        'AUDIT_CAPTURE_FAILED',
        p_entity_type,
        p_operation,
        jsonb_build_object(
          'entity_id', p_entity_id,
          'error',     SQLERRM,
          'sqlstate',  SQLSTATE
        )
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.capture_governance_audit(TEXT, UUID, TEXT, JSONB, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.capture_governance_audit(TEXT, UUID, TEXT, JSONB, JSONB) TO service_role;

-- ============================================================
-- pgTAP para suite T1–T15
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;