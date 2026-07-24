
-- 1) Amplia constraints de governance_audit_log
ALTER TABLE public.governance_audit_log
  DROP CONSTRAINT IF EXISTS governance_audit_log_entity_type_check;
ALTER TABLE public.governance_audit_log
  ADD CONSTRAINT governance_audit_log_entity_type_check
  CHECK (entity_type = ANY (ARRAY[
    'nexus_relation','translation_source','editorial_closure_migration'
  ]));

ALTER TABLE public.governance_audit_log
  DROP CONSTRAINT IF EXISTS governance_audit_log_operation_check;
ALTER TABLE public.governance_audit_log
  ADD CONSTRAINT governance_audit_log_operation_check
  CHECK (operation = ANY (ARRAY[
    'INSERT','UPDATE','DELETE',
    'PCL_ACTIVATED','PCL_SUSPENDED','PCL_REVOKED','PCL_EXPIRED',
    'CLOSURE_MIGRATION_DRY_RUN','CLOSURE_MIGRATION_APPLY',
    'CLOSURE_MIGRATION_ROLLBACK','CLOSURE_MIGRATION_ROLLBACK_CONFLICT'
  ]));

-- 2) run_id no log
ALTER TABLE public.editorial_closure_migration_log
  ADD COLUMN IF NOT EXISTS run_id UUID;

CREATE INDEX IF NOT EXISTS idx_closure_migration_run
  ON public.editorial_closure_migration_log (run_id, entity_table);

-- 3) Nova função de migração com filtros e run_id
DROP FUNCTION IF EXISTS public.migrate_editorial_closure_legacy(BOOLEAN);
DROP FUNCTION IF EXISTS public.migrate_editorial_closure_legacy(BOOLEAN, TEXT[], TEXT[], TIMESTAMPTZ, UUID);

CREATE OR REPLACE FUNCTION public.migrate_editorial_closure_legacy(
  _dry_run BOOLEAN DEFAULT true,
  _tables  TEXT[] DEFAULT NULL,
  _ids     TEXT[] DEFAULT NULL,
  _since   TIMESTAMPTZ DEFAULT NULL,
  _run_id  UUID DEFAULT NULL
)
RETURNS TABLE(entity_table TEXT, scanned INT, normalized INT, unchanged INT, discarded INT, run_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_all TEXT[] := ARRAY['glossary','saints','catechism_official','prayers','saint_works'];
  v_tables TEXT[];
  v_tbl TEXT;
  v_sql TEXT;
  v_where TEXT;
  v_row RECORD;
  v_norm RECORD;
  v_scanned INT;
  v_normalized INT;
  v_unchanged INT;
  v_discarded INT;
  v_run UUID := COALESCE(_run_id, gen_random_uuid());
  v_totals JSONB := '{}'::jsonb;
  v_has_updated BOOLEAN;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden: admin role required';
  END IF;

  IF _tables IS NULL OR array_length(_tables,1) IS NULL THEN
    v_tables := v_all;
  ELSE
    SELECT ARRAY(SELECT unnest(_tables) INTERSECT SELECT unnest(v_all)) INTO v_tables;
    IF array_length(v_tables,1) IS NULL THEN
      RAISE EXCEPTION 'no valid tables selected';
    END IF;
  END IF;

  INSERT INTO public.governance_audit_log
    (actor_id, actor_role, entity_type, entity_id, operation, after_state, correlation_id)
  VALUES (
    auth.uid(), 'authenticated', 'editorial_closure_migration', v_run,
    CASE WHEN _dry_run THEN 'CLOSURE_MIGRATION_DRY_RUN' ELSE 'CLOSURE_MIGRATION_APPLY' END,
    jsonb_build_object('tables', to_jsonb(v_tables), 'ids', to_jsonb(_ids), 'since', _since, 'phase','start'),
    v_run::text
  );

  FOREACH v_tbl IN ARRAY v_tables LOOP
    v_scanned := 0; v_normalized := 0; v_unchanged := 0; v_discarded := 0;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name=v_tbl AND column_name='updated_at'
    ) INTO v_has_updated;

    v_where := 'editorial_closure IS NOT NULL';
    IF _ids IS NOT NULL AND array_length(_ids,1) IS NOT NULL THEN
      v_where := v_where || ' AND id::text = ANY($1)';
    END IF;
    IF _since IS NOT NULL AND v_has_updated THEN
      v_where := v_where || ' AND updated_at >= $2';
    END IF;

    v_sql := format('SELECT id::text AS id, editorial_closure FROM public.%I WHERE %s', v_tbl, v_where);

    FOR v_row IN EXECUTE v_sql
      USING COALESCE(_ids, ARRAY[]::text[]), COALESCE(_since, '-infinity'::timestamptz)
    LOOP
      v_scanned := v_scanned + 1;
      SELECT * INTO v_norm FROM public.normalize_editorial_closure(v_row.editorial_closure);

      IF v_norm.canonical IS NULL THEN
        v_discarded := v_discarded + 1;
        INSERT INTO public.editorial_closure_migration_log
          (entity_table, entity_id, strategy, before_value, after_value, warnings, dry_run, run_id)
        VALUES (v_tbl, v_row.id, 'discarded', v_row.editorial_closure, NULL, v_norm.warnings, _dry_run, v_run);
      ELSIF v_norm.strategy = 'noop' AND v_norm.canonical = v_row.editorial_closure THEN
        v_unchanged := v_unchanged + 1;
      ELSE
        v_normalized := v_normalized + 1;
        INSERT INTO public.editorial_closure_migration_log
          (entity_table, entity_id, strategy, before_value, after_value, warnings, dry_run, run_id)
        VALUES (v_tbl, v_row.id, v_norm.strategy, v_row.editorial_closure, v_norm.canonical, v_norm.warnings, _dry_run, v_run);

        IF NOT _dry_run THEN
          EXECUTE format('UPDATE public.%I SET editorial_closure = $1 WHERE id::text = $2', v_tbl)
            USING v_norm.canonical, v_row.id;
        END IF;
      END IF;
    END LOOP;

    v_totals := v_totals || jsonb_build_object(v_tbl,
      jsonb_build_object('scanned',v_scanned,'normalized',v_normalized,'unchanged',v_unchanged,'discarded',v_discarded));

    entity_table := v_tbl;
    scanned := v_scanned; normalized := v_normalized;
    unchanged := v_unchanged; discarded := v_discarded;
    run_id := v_run;
    RETURN NEXT;
  END LOOP;

  INSERT INTO public.governance_audit_log
    (actor_id, actor_role, entity_type, entity_id, operation, after_state, correlation_id)
  VALUES (
    auth.uid(),'authenticated','editorial_closure_migration', v_run,
    CASE WHEN _dry_run THEN 'CLOSURE_MIGRATION_DRY_RUN' ELSE 'CLOSURE_MIGRATION_APPLY' END,
    jsonb_build_object('phase','end','totals', v_totals),
    v_run::text
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.migrate_editorial_closure_legacy(BOOLEAN, TEXT[], TEXT[], TIMESTAMPTZ, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.migrate_editorial_closure_legacy(BOOLEAN, TEXT[], TEXT[], TIMESTAMPTZ, UUID) TO authenticated;

COMMENT ON FUNCTION public.migrate_editorial_closure_legacy(BOOLEAN, TEXT[], TEXT[], TIMESTAMPTZ, UUID) IS
'Normaliza editorial_closure legado. Filtros: _tables, _ids, _since. Retorna run_id agregador. Log em editorial_closure_migration_log; auditoria em governance_audit_log.';

-- 4) Rollback seguro (aborta em conflito)
CREATE OR REPLACE FUNCTION public.rollback_editorial_closure_migration(_run_id UUID)
RETURNS TABLE(entity_table TEXT, restored INT, conflicted INT, skipped INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_tbl TEXT;
  v_row RECORD;
  v_current JSONB;
  v_restored INT;
  v_conflicted INT;
  v_skipped INT;
  v_tables TEXT[];
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden: admin role required';
  END IF;

  SELECT ARRAY(
    SELECT DISTINCT l.entity_table
    FROM public.editorial_closure_migration_log l
    WHERE l.run_id = _run_id AND l.dry_run = false AND l.strategy <> 'discarded'
  ) INTO v_tables;

  IF array_length(v_tables,1) IS NULL THEN
    RAISE EXCEPTION 'no applied changes found for run_id %', _run_id;
  END IF;

  INSERT INTO public.governance_audit_log
    (actor_id, actor_role, entity_type, entity_id, operation, after_state, correlation_id)
  VALUES (auth.uid(),'authenticated','editorial_closure_migration', _run_id,
          'CLOSURE_MIGRATION_ROLLBACK',
          jsonb_build_object('phase','start','tables', to_jsonb(v_tables)),
          _run_id::text);

  FOREACH v_tbl IN ARRAY v_tables LOOP
    v_restored := 0; v_conflicted := 0; v_skipped := 0;

    FOR v_row IN
      SELECT entity_id, before_value, after_value
      FROM public.editorial_closure_migration_log
      WHERE run_id = _run_id AND dry_run = false
        AND entity_table = v_tbl AND strategy <> 'discarded'
    LOOP
      EXECUTE format('SELECT editorial_closure FROM public.%I WHERE id::text = $1', v_tbl)
        INTO v_current USING v_row.entity_id;

      IF v_current IS NULL THEN
        v_skipped := v_skipped + 1;
        CONTINUE;
      END IF;

      IF v_current IS DISTINCT FROM v_row.after_value THEN
        v_conflicted := v_conflicted + 1;
        INSERT INTO public.governance_audit_log
          (actor_id, actor_role, entity_type, entity_id, operation, before_state, after_state, correlation_id)
        VALUES (auth.uid(),'authenticated','editorial_closure_migration', _run_id,
                'CLOSURE_MIGRATION_ROLLBACK_CONFLICT',
                jsonb_build_object('table', v_tbl, 'entity_id', v_row.entity_id, 'expected', v_row.after_value),
                jsonb_build_object('current', v_current),
                _run_id::text);
        CONTINUE;
      END IF;

      EXECUTE format('UPDATE public.%I SET editorial_closure = $1 WHERE id::text = $2', v_tbl)
        USING v_row.before_value, v_row.entity_id;
      v_restored := v_restored + 1;
    END LOOP;

    entity_table := v_tbl;
    restored := v_restored; conflicted := v_conflicted; skipped := v_skipped;
    RETURN NEXT;
  END LOOP;

  INSERT INTO public.governance_audit_log
    (actor_id, actor_role, entity_type, entity_id, operation, after_state, correlation_id)
  VALUES (auth.uid(),'authenticated','editorial_closure_migration', _run_id,
          'CLOSURE_MIGRATION_ROLLBACK',
          jsonb_build_object('phase','end'),
          _run_id::text);
END;
$fn$;

REVOKE ALL ON FUNCTION public.rollback_editorial_closure_migration(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rollback_editorial_closure_migration(UUID) TO authenticated;

COMMENT ON FUNCTION public.rollback_editorial_closure_migration(UUID) IS
'Restaura editorial_closure ao before_value para as linhas normalizadas de um run_id. Aborta a linha (conflict) se o valor atual não bate com o after gravado. Audita em governance_audit_log.';
