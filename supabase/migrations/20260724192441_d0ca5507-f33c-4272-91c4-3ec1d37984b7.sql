
-- Log de migrações do editorial_closure legado
CREATE TABLE IF NOT EXISTS public.editorial_closure_migration_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_table TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  strategy TEXT NOT NULL,        -- 'string-to-object' | 'aliases-normalized' | 'json-string-parsed' | 'noop'
  before_value JSONB,            -- valor bruto anterior (stringificado)
  after_value JSONB,             -- valor canônico gravado
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  dry_run BOOLEAN NOT NULL DEFAULT true,
  actor UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.editorial_closure_migration_log TO authenticated;
GRANT ALL ON public.editorial_closure_migration_log TO service_role;

ALTER TABLE public.editorial_closure_migration_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "closure_migration_log_read_admin" ON public.editorial_closure_migration_log;
CREATE POLICY "closure_migration_log_read_admin"
  ON public.editorial_closure_migration_log FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_closure_migration_entity
  ON public.editorial_closure_migration_log (entity_table, entity_id, created_at DESC);

-- Normaliza um valor legado (jsonb) em jsonb canônico ou null.
-- Regras:
--  * string JSON parseável -> parseia
--  * string pura           -> { reflection: <texto> }
--  * aliases PT-BR         -> reflection/application/prayer
--  * next.url              -> next.href
--  * nexus sem kind/ref/label ou kind fora do enum -> descartado
CREATE OR REPLACE FUNCTION public.normalize_editorial_closure(_raw JSONB)
RETURNS TABLE(canonical JSONB, strategy TEXT, warnings JSONB)
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_obj JSONB;
  v_out JSONB := '{}'::jsonb;
  v_next JSONB;
  v_nexus JSONB := '[]'::jsonb;
  v_warn JSONB := '[]'::jsonb;
  v_strategy TEXT := 'noop';
  v_txt TEXT;
  v_item JSONB;
  v_kind TEXT;
  v_ref TEXT;
  v_label TEXT;
  v_valid_kinds TEXT[] := ARRAY['bible_verse','catechism_paragraph','magisterium_doc','patristic','saint','saint_work','glossary','prayer','journey','liturgy','other'];
  i INT := 0;
BEGIN
  IF _raw IS NULL OR _raw = 'null'::jsonb THEN
    RETURN QUERY SELECT NULL::JSONB, 'noop'::TEXT, v_warn; RETURN;
  END IF;

  -- STRING no jsonb (tipo "string")
  IF jsonb_typeof(_raw) = 'string' THEN
    v_txt := trim(both from (_raw #>> '{}'));
    IF v_txt = '' THEN
      RETURN QUERY SELECT NULL::JSONB, 'noop'::TEXT, v_warn; RETURN;
    END IF;
    IF left(v_txt,1) IN ('{','[') THEN
      BEGIN
        v_obj := v_txt::jsonb;
        v_strategy := 'json-string-parsed';
        v_warn := v_warn || to_jsonb('closure era string JSON — parseado');
      EXCEPTION WHEN others THEN
        v_obj := jsonb_build_object('reflection', v_txt);
        v_strategy := 'string-to-object';
        v_warn := v_warn || to_jsonb('closure parecia JSON mas falhou — tratado como reflexão');
      END;
    ELSE
      v_obj := jsonb_build_object('reflection', v_txt);
      v_strategy := 'string-to-object';
      v_warn := v_warn || to_jsonb('closure era string pura — virou reflection');
    END IF;
  ELSIF jsonb_typeof(_raw) = 'object' THEN
    v_obj := _raw;
  ELSE
    v_warn := v_warn || to_jsonb('tipo inesperado — descartado');
    RETURN QUERY SELECT NULL::JSONB, 'noop'::TEXT, v_warn; RETURN;
  END IF;

  -- Reflection (canônico + aliases)
  v_txt := COALESCE(
    NULLIF(trim(v_obj->>'reflection'), ''),
    NULLIF(trim(v_obj->>'reflexao'), ''),
    NULLIF(trim(v_obj->>'reflexão'), ''),
    NULLIF(trim(v_obj->>'meditation'), ''),
    NULLIF(trim(v_obj->>'meditacao'), ''),
    NULLIF(trim(v_obj->>'meditação'), ''),
    NULLIF(trim(v_obj->>'text'), ''),
    NULLIF(trim(v_obj->>'conclusion'), ''),
    NULLIF(trim(v_obj->>'closure'), '')
  );
  IF v_txt IS NOT NULL THEN
    v_out := v_out || jsonb_build_object('reflection', v_txt);
    IF NOT (v_obj ? 'reflection') THEN
      v_warn := v_warn || to_jsonb('reflection normalizado a partir de alias');
      IF v_strategy = 'noop' THEN v_strategy := 'aliases-normalized'; END IF;
    END IF;
  END IF;

  v_txt := COALESCE(
    NULLIF(trim(v_obj->>'application'), ''),
    NULLIF(trim(v_obj->>'aplicacao'), ''),
    NULLIF(trim(v_obj->>'aplicação'), ''),
    NULLIF(trim(v_obj->>'action'), ''),
    NULLIF(trim(v_obj->>'acao'), ''),
    NULLIF(trim(v_obj->>'ação'), ''),
    NULLIF(trim(v_obj->>'practice'), ''),
    NULLIF(trim(v_obj->>'pratica'), ''),
    NULLIF(trim(v_obj->>'prática'), '')
  );
  IF v_txt IS NOT NULL THEN
    v_out := v_out || jsonb_build_object('application', v_txt);
    IF NOT (v_obj ? 'application') THEN
      v_warn := v_warn || to_jsonb('application normalizado a partir de alias');
      IF v_strategy = 'noop' THEN v_strategy := 'aliases-normalized'; END IF;
    END IF;
  END IF;

  v_txt := COALESCE(
    NULLIF(trim(v_obj->>'prayer'), ''),
    NULLIF(trim(v_obj->>'oracao'), ''),
    NULLIF(trim(v_obj->>'oração'), ''),
    NULLIF(trim(v_obj->>'prece'), ''),
    NULLIF(trim(v_obj->>'oratio'), '')
  );
  IF v_txt IS NOT NULL THEN
    v_out := v_out || jsonb_build_object('prayer', v_txt);
    IF NOT (v_obj ? 'prayer') THEN
      v_warn := v_warn || to_jsonb('prayer normalizado a partir de alias');
      IF v_strategy = 'noop' THEN v_strategy := 'aliases-normalized'; END IF;
    END IF;
  END IF;

  -- next
  IF jsonb_typeof(v_obj->'next') = 'object' THEN
    v_next := v_obj->'next';
    DECLARE
      n_label TEXT := COALESCE(v_next->>'label', v_next->>'title');
      n_href  TEXT := COALESCE(v_next->>'href', v_next->>'url');
      n_kicker TEXT := v_next->>'kicker';
    BEGIN
      IF n_label IS NOT NULL AND n_href IS NOT NULL THEN
        v_out := v_out || jsonb_build_object('next',
          jsonb_strip_nulls(jsonb_build_object('label', n_label, 'href', n_href, 'kicker', n_kicker)));
        IF NOT (v_next ? 'href') AND (v_next ? 'url') THEN
          v_warn := v_warn || to_jsonb('next.url convertido para next.href');
          IF v_strategy = 'noop' THEN v_strategy := 'aliases-normalized'; END IF;
        END IF;
      ELSE
        v_warn := v_warn || to_jsonb('next descartado: faltam label/href');
      END IF;
    END;
  END IF;

  -- nexus
  IF jsonb_typeof(v_obj->'nexus') = 'array' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_obj->'nexus') LOOP
      IF jsonb_typeof(v_item) <> 'object' THEN
        v_warn := v_warn || to_jsonb(format('nexus[%s] descartado: não é objeto', i));
        i := i + 1; CONTINUE;
      END IF;
      v_kind := COALESCE(v_item->>'kind', v_item->>'type');
      v_ref  := COALESCE(v_item->>'ref',  v_item->>'id', v_item->>'slug');
      v_label := COALESCE(v_item->>'label', v_item->>'title');
      IF v_kind IS NULL OR v_ref IS NULL OR v_label IS NULL
         OR NOT (v_kind = ANY(v_valid_kinds)) THEN
        v_warn := v_warn || to_jsonb(format('nexus[%s] descartado: campos inválidos', i));
      ELSE
        v_nexus := v_nexus || jsonb_build_object(
          'kind', v_kind, 'ref', v_ref, 'label', v_label,
          'note', v_item->>'note'
        );
      END IF;
      i := i + 1;
    END LOOP;
    IF jsonb_array_length(v_nexus) > 0 THEN
      v_out := v_out || jsonb_build_object('nexus', v_nexus);
    END IF;
  END IF;

  IF v_obj ? 'source' THEN
    v_out := v_out || jsonb_build_object('source', v_obj->>'source');
  END IF;

  -- Nada aproveitável
  IF v_out = '{}'::jsonb THEN
    RETURN QUERY SELECT NULL::JSONB, 'noop'::TEXT, v_warn; RETURN;
  END IF;

  RETURN QUERY SELECT jsonb_strip_nulls(v_out), v_strategy, v_warn;
END;
$$;

-- Comando de migração: percorre todas as tabelas com editorial_closure,
-- normaliza legados, escreve no log e (se _dry_run=false) atualiza a linha.
-- Retorna resumo por tabela.
CREATE OR REPLACE FUNCTION public.migrate_editorial_closure_legacy(_dry_run BOOLEAN DEFAULT true)
RETURNS TABLE(entity_table TEXT, scanned INT, normalized INT, unchanged INT, discarded INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tables TEXT[] := ARRAY['glossary','saints','catechism_official','prayers','saint_works'];
  v_tbl TEXT;
  v_sql TEXT;
  v_row RECORD;
  v_norm RECORD;
  v_scanned INT;
  v_normalized INT;
  v_unchanged INT;
  v_discarded INT;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden: admin role required';
  END IF;

  FOREACH v_tbl IN ARRAY v_tables LOOP
    v_scanned := 0; v_normalized := 0; v_unchanged := 0; v_discarded := 0;
    v_sql := format(
      'SELECT id::text AS id, editorial_closure FROM public.%I WHERE editorial_closure IS NOT NULL',
      v_tbl
    );
    FOR v_row IN EXECUTE v_sql LOOP
      v_scanned := v_scanned + 1;
      SELECT * INTO v_norm FROM public.normalize_editorial_closure(v_row.editorial_closure);

      IF v_norm.canonical IS NULL THEN
        v_discarded := v_discarded + 1;
        INSERT INTO public.editorial_closure_migration_log
          (entity_table, entity_id, strategy, before_value, after_value, warnings, dry_run)
        VALUES (v_tbl, v_row.id, 'discarded', v_row.editorial_closure, NULL, v_norm.warnings, _dry_run);
      ELSIF v_norm.strategy = 'noop' AND v_norm.canonical = v_row.editorial_closure THEN
        v_unchanged := v_unchanged + 1;
      ELSE
        v_normalized := v_normalized + 1;
        INSERT INTO public.editorial_closure_migration_log
          (entity_table, entity_id, strategy, before_value, after_value, warnings, dry_run)
        VALUES (v_tbl, v_row.id, v_norm.strategy, v_row.editorial_closure, v_norm.canonical, v_norm.warnings, _dry_run);

        IF NOT _dry_run THEN
          EXECUTE format(
            'UPDATE public.%I SET editorial_closure = $1 WHERE id::text = $2',
            v_tbl
          ) USING v_norm.canonical, v_row.id;
        END IF;
      END IF;
    END LOOP;

    entity_table := v_tbl;
    scanned := v_scanned;
    normalized := v_normalized;
    unchanged := v_unchanged;
    discarded := v_discarded;
    RETURN NEXT;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.migrate_editorial_closure_legacy(BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.migrate_editorial_closure_legacy(BOOLEAN) TO authenticated;

COMMENT ON FUNCTION public.migrate_editorial_closure_legacy(BOOLEAN) IS
'Normaliza editorial_closure legado (string/aliases) em objeto canônico. Uso: SELECT * FROM migrate_editorial_closure_legacy(true) para dry-run; false aplica. Log em editorial_closure_migration_log.';
