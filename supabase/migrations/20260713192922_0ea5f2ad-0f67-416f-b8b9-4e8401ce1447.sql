-- ============================================================
-- Sprint 1.13 — M3/4
-- Helper jsonb_shallow_diff + função captura + triggers Nexus e PCL
-- ============================================================

-- ------------------------------------------------------------
-- 1) Helper: diff superficial entre dois JSONB
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.jsonb_shallow_diff(
  p_before JSONB,
  p_after  JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSONB := '{}'::JSONB;
  v_key    TEXT;
  v_keys   TEXT[];
BEGIN
  IF p_before IS NULL AND p_after IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT array_agg(DISTINCT k) INTO v_keys
  FROM (
    SELECT jsonb_object_keys(COALESCE(p_before, '{}'::JSONB)) AS k
    UNION
    SELECT jsonb_object_keys(COALESCE(p_after,  '{}'::JSONB)) AS k
  ) t;

  IF v_keys IS NULL THEN
    RETURN NULL;
  END IF;

  FOREACH v_key IN ARRAY v_keys LOOP
    IF (p_before -> v_key) IS DISTINCT FROM (p_after -> v_key) THEN
      v_result := v_result || jsonb_build_object(
        v_key, jsonb_build_object(
          'old', p_before -> v_key,
          'new', p_after  -> v_key
        )
      );
    END IF;
  END LOOP;

  RETURN CASE WHEN v_result = '{}'::JSONB THEN NULL ELSE v_result END;
END;
$$;

-- Restringir execução (sem exposição pública)
REVOKE ALL ON FUNCTION public.jsonb_shallow_diff(JSONB, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.jsonb_shallow_diff(JSONB, JSONB) TO service_role;

-- ------------------------------------------------------------
-- 2) Função central de captura (invariante I2)
-- ------------------------------------------------------------

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
  v_diff           JSONB;
BEGIN
  BEGIN
    v_actor_id       := auth.uid();
    v_actor_role     := COALESCE(current_setting('request.jwt.claim.role', true), 'system');
    v_correlation_id := NULLIF(current_setting('audit.correlation_id', true), '');

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
    -- INVARIANTE I5: falha no log NUNCA aborta a operação de negócio
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
      -- Silêncio absoluto: log-de-log falhou; não podemos abortar
      NULL;
    END;
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.capture_governance_audit(TEXT, UUID, TEXT, JSONB, JSONB) FROM PUBLIC;
-- Sem GRANT para authenticated/anon: chamada exclusivamente por triggers SECURITY DEFINER

-- ------------------------------------------------------------
-- 3) Trigger: nexus_relations (INSERT/UPDATE/DELETE)
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tr_audit_nexus_relations_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_entity_id UUID;
  v_before    JSONB;
  v_after     JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_entity_id := NEW.id;
    v_before    := NULL;
    v_after     := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_entity_id := NEW.id;
    v_before    := to_jsonb(OLD);
    v_after     := to_jsonb(NEW);
    -- Só registra se algo realmente mudou
    IF v_before IS NOT DISTINCT FROM v_after THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_entity_id := OLD.id;
    v_before    := to_jsonb(OLD);
    v_after     := NULL;
  END IF;

  PERFORM public.capture_governance_audit(
    'nexus_relation', v_entity_id, TG_OP, v_before, v_after
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION public.tr_audit_nexus_relations_fn() FROM PUBLIC;

DROP TRIGGER IF EXISTS tr_audit_nexus_relations ON public.nexus_relations;
CREATE TRIGGER tr_audit_nexus_relations
  AFTER INSERT OR UPDATE OR DELETE ON public.nexus_relations
  FOR EACH ROW
  EXECUTE FUNCTION public.tr_audit_nexus_relations_fn();

-- ------------------------------------------------------------
-- 4) Trigger: bible_translation_sources (ciclo PCL)
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tr_audit_translation_pcl_lifecycle_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_operation TEXT;
  v_before    JSONB;
  v_after     JSONB;
BEGIN
  -- Só age em mudança real de pcl_status
  IF OLD.pcl_status IS NOT DISTINCT FROM NEW.pcl_status THEN
    RETURN NEW;
  END IF;

  -- Classificação da transição
  IF NEW.pcl_status = 'active' THEN
    v_operation := 'PCL_ACTIVATED';
  ELSIF OLD.pcl_status = 'active' AND NEW.pcl_status = 'suspended' THEN
    v_operation := 'PCL_SUSPENDED';
  ELSIF OLD.pcl_status = 'active' AND NEW.pcl_status = 'revoked' THEN
    v_operation := 'PCL_REVOKED';
  ELSIF OLD.pcl_status = 'active' AND NEW.pcl_status = 'expired' THEN
    v_operation := 'PCL_EXPIRED';
  ELSE
    v_operation := 'UPDATE';
  END IF;

  -- Payload mínimo: apenas campos do ciclo PCL
  v_before := jsonb_build_object(
    'pcl_status',        OLD.pcl_status,
    'pcl_activated_by',  OLD.pcl_activated_by,
    'pcl_activated_at',  OLD.pcl_activated_at,
    'status',            OLD.status,
    'is_primary',        OLD.is_primary
  );
  v_after := jsonb_build_object(
    'pcl_status',        NEW.pcl_status,
    'pcl_activated_by',  NEW.pcl_activated_by,
    'pcl_activated_at',  NEW.pcl_activated_at,
    'status',            NEW.status,
    'is_primary',        NEW.is_primary
  );

  PERFORM public.capture_governance_audit(
    'translation_source', NEW.id, v_operation, v_before, v_after
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.tr_audit_translation_pcl_lifecycle_fn() FROM PUBLIC;

DROP TRIGGER IF EXISTS tr_audit_translation_pcl_lifecycle ON public.bible_translation_sources;
CREATE TRIGGER tr_audit_translation_pcl_lifecycle
  AFTER UPDATE ON public.bible_translation_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.tr_audit_translation_pcl_lifecycle_fn();