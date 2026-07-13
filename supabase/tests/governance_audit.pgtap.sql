-- ============================================================
-- Sprint 1.13 — Suite pgTAP T1–T15
-- Cobertura das invariantes de governance_audit_log (ADR-008)
-- Executar: pg_prove -d <db> supabase/tests/governance_audit.pgtap.sql
-- ============================================================

BEGIN;
SELECT plan(15);

-- ------------------------------------------------------------
-- Fixtures
-- ------------------------------------------------------------
CREATE TEMP TABLE _cid(v UUID);
INSERT INTO _cid VALUES (gen_random_uuid());

-- Seed nexus_relation_type mínimo (idempotente)
INSERT INTO public.nexus_relation_types (code, label, is_active)
VALUES ('paralelo', 'Paralelo (teste pgTAP)', true)
ON CONFLICT (code) DO NOTHING;

-- ------------------------------------------------------------
-- T1: INSERT em nexus_relations gera 1 linha audit com operation='INSERT'
-- ------------------------------------------------------------
DO $$
DECLARE v UUID;
BEGIN
  INSERT INTO public.nexus_relations (
    relation_type, source_kind, source_ref, target_kind, target_ref
  ) VALUES (
    'paralelo', 'bible_verse',
    jsonb_build_object('abbrev','Jo','chapter',3,'verse',16),
    'catechism_paragraph',
    jsonb_build_object('paragraph',460)
  ) RETURNING id INTO v;
  PERFORM set_config('audit.test_nexus_id', v::text, true);
END $$;

SELECT is(
  (SELECT count(*)::INT
     FROM public.governance_audit_log
     WHERE entity_type='nexus_relation'
       AND entity_id=current_setting('audit.test_nexus_id')::UUID
       AND operation='INSERT'),
  1, 'T1: INSERT gera 1 audit row'
);

-- ------------------------------------------------------------
-- T2: audit registra before_state=NULL, after_state completo
-- ------------------------------------------------------------
SELECT ok(
  (SELECT before_state IS NULL AND after_state ? 'relation_type'
     FROM public.governance_audit_log
     WHERE entity_id=current_setting('audit.test_nexus_id')::UUID
     ORDER BY occurred_at DESC LIMIT 1),
  'T2: before_state NULL / after_state completo em INSERT'
);

-- ------------------------------------------------------------
-- T3: UPDATE gera linha com diff apenas dos campos alterados
-- ------------------------------------------------------------
UPDATE public.nexus_relations
   SET note = 'nota-teste'
 WHERE id = current_setting('audit.test_nexus_id')::UUID;

SELECT ok(
  (SELECT diff ? 'note' AND (diff -> 'note' ->> 'new') = 'nota-teste'
     FROM public.governance_audit_log
     WHERE entity_id=current_setting('audit.test_nexus_id')::UUID
       AND operation='UPDATE'
     ORDER BY occurred_at DESC LIMIT 1),
  'T3: UPDATE registra diff mínimo do campo alterado'
);

-- ------------------------------------------------------------
-- T4: diff omite campos NÃO alterados
-- ------------------------------------------------------------
SELECT ok(
  (SELECT NOT (diff ? 'relation_type')
     FROM public.governance_audit_log
     WHERE entity_id=current_setting('audit.test_nexus_id')::UUID
       AND operation='UPDATE'
     ORDER BY occurred_at DESC LIMIT 1),
  'T4: diff não inclui campos inalterados'
);

-- ------------------------------------------------------------
-- T5: DELETE gera linha com after_state=NULL
-- ------------------------------------------------------------
DELETE FROM public.nexus_relations
 WHERE id = current_setting('audit.test_nexus_id')::UUID;

SELECT is(
  (SELECT after_state
     FROM public.governance_audit_log
     WHERE entity_id=current_setting('audit.test_nexus_id')::UUID
       AND operation='DELETE'
     LIMIT 1),
  NULL::jsonb,
  'T5: DELETE registra after_state NULL'
);

-- ------------------------------------------------------------
-- T6: occurred_at é preenchido automaticamente e recente
-- ------------------------------------------------------------
SELECT ok(
  (SELECT occurred_at BETWEEN now() - INTERVAL '5 min' AND now() + INTERVAL '1 min'
     FROM public.governance_audit_log
     WHERE entity_id=current_setting('audit.test_nexus_id')::UUID
     ORDER BY occurred_at DESC LIMIT 1),
  'T6: occurred_at recente'
);

-- ------------------------------------------------------------
-- T7: trigger de PCL classifica PCL_ACTIVATED em transição para active
-- ------------------------------------------------------------
DO $$
DECLARE v UUID;
BEGIN
  INSERT INTO public.bible_translation_sources (
    code, name, provider, pcl_status
  ) VALUES (
    'pgtap-'||substr(md5(random()::text),1,6),
    'PGTap Test Src', 'test', 'draft'
  ) RETURNING id INTO v;
  PERFORM set_config('audit.test_src_id', v::text, true);

  -- Transição draft → active com autoridade admin
  UPDATE public.bible_translation_sources
     SET pcl_status='active',
         pcl_activated_by=(SELECT id FROM auth.users LIMIT 1),
         pcl_activated_at=now()
   WHERE id=v;
END $$;

SELECT is(
  (SELECT operation
     FROM public.governance_audit_log
     WHERE entity_id=current_setting('audit.test_src_id')::UUID
     ORDER BY occurred_at DESC LIMIT 1),
  'PCL_ACTIVATED',
  'T7: transição → active classifica PCL_ACTIVATED'
);

-- ------------------------------------------------------------
-- T8: transição active → suspended classifica PCL_SUSPENDED
-- ------------------------------------------------------------
UPDATE public.bible_translation_sources
   SET pcl_status='suspended'
 WHERE id=current_setting('audit.test_src_id')::UUID;

SELECT is(
  (SELECT operation
     FROM public.governance_audit_log
     WHERE entity_id=current_setting('audit.test_src_id')::UUID
     ORDER BY occurred_at DESC LIMIT 1),
  'PCL_SUSPENDED', 'T8: active → suspended = PCL_SUSPENDED'
);

-- ------------------------------------------------------------
-- T9: UPDATE que NÃO altera pcl_status NÃO gera row PCL_*
-- ------------------------------------------------------------
DO $$
DECLARE cnt_before INT;
BEGIN
  SELECT count(*) INTO cnt_before
    FROM public.governance_audit_log
    WHERE entity_id=current_setting('audit.test_src_id')::UUID;
  UPDATE public.bible_translation_sources
     SET name = name || ' (touched)'
   WHERE id=current_setting('audit.test_src_id')::UUID;
  PERFORM set_config('audit.test_cnt_before', cnt_before::text, true);
END $$;

SELECT is(
  (SELECT count(*)::INT
     FROM public.governance_audit_log
     WHERE entity_id=current_setting('audit.test_src_id')::UUID),
  current_setting('audit.test_cnt_before')::INT,
  'T9: UPDATE sem mudar pcl_status não gera row PCL_*'
);

-- ------------------------------------------------------------
-- T10: authenticated não pode INSERT direto em governance_audit_log
-- ------------------------------------------------------------
SELECT throws_ok(
  $$SET LOCAL ROLE authenticated;
    INSERT INTO public.governance_audit_log
      (actor_role, entity_type, entity_id, operation)
    VALUES ('authenticated','nexus_relation',gen_random_uuid(),'INSERT');$$,
  '42501', NULL,
  'T10: authenticated recebe permission denied em INSERT direto'
);
RESET ROLE;

-- ------------------------------------------------------------
-- T11: anon não pode SELECT em governance_audit_log
-- ------------------------------------------------------------
SELECT throws_ok(
  $$SET LOCAL ROLE anon;
    SELECT * FROM public.governance_audit_log LIMIT 1;$$,
  '42501', NULL,
  'T11: anon recebe permission denied em SELECT'
);
RESET ROLE;

-- ------------------------------------------------------------
-- T12: correlation_id do header é capturado (via set_config path)
-- ------------------------------------------------------------
DO $$
DECLARE v UUID; c TEXT := 'cid-pgtap-' || substr(md5(random()::text),1,8);
BEGIN
  PERFORM set_config('audit.correlation_id', c, true);
  INSERT INTO public.nexus_relations (
    relation_type, source_kind, source_ref, target_kind, target_ref
  ) VALUES (
    'paralelo','bible_verse', jsonb_build_object('abbrev','Mc','chapter',1),
    'catechism_paragraph', jsonb_build_object('paragraph',1)
  ) RETURNING id INTO v;
  PERFORM set_config('audit.test_cid_id', v::text, true);
  PERFORM set_config('audit.test_cid_val', c, true);
END $$;

SELECT is(
  (SELECT correlation_id
     FROM public.governance_audit_log
     WHERE entity_id=current_setting('audit.test_cid_id')::UUID
     LIMIT 1),
  current_setting('audit.test_cid_val'),
  'T12: correlation_id via set_config persiste no log'
);

-- ------------------------------------------------------------
-- T13: fn_archive_governance_audit chamada por não-admin → Access denied
-- ------------------------------------------------------------
SELECT throws_ok(
  $$SET LOCAL ROLE authenticated;
    SELECT public.fn_archive_governance_audit('admin', NULL);$$,
  NULL, 'Access denied',
  'T13: fn_archive não-admin → Access denied'
);
RESET ROLE;

-- ------------------------------------------------------------
-- T14: fn_archive_governance_audit(admin, 0) move linhas para archive
-- ------------------------------------------------------------
DO $$
DECLARE r RECORD;
BEGIN
  SELECT * INTO r FROM public.fn_archive_governance_audit('admin', 0);
  PERFORM set_config('audit.test_archived', r.rows_archived::text, true);
END $$;

SELECT ok(
  current_setting('audit.test_archived')::INT > 0,
  'T14: fn_archive move linhas quando override_days=0'
);

-- ------------------------------------------------------------
-- T15: cleanup_runs registra a execução
-- ------------------------------------------------------------
SELECT ok(
  EXISTS(
    SELECT 1 FROM public.governance_audit_log_cleanup_runs
    WHERE triggered_by='admin' AND status='ok'
      AND created_at >= now() - INTERVAL '2 min'
  ),
  'T15: cleanup_runs registra execução recente'
);

-- ------------------------------------------------------------
SELECT * FROM finish();
ROLLBACK;
