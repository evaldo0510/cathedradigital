
-- ============ 1. nexus_relation_types ============
CREATE TABLE public.nexus_relation_types (
  code TEXT PRIMARY KEY,
  label_pt TEXT NOT NULL,
  description TEXT NOT NULL,
  provisional BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.nexus_relation_types TO anon, authenticated;
GRANT ALL ON public.nexus_relation_types TO service_role;

ALTER TABLE public.nexus_relation_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nexus_relation_types_read_all"
  ON public.nexus_relation_types FOR SELECT
  USING (true);

CREATE POLICY "nexus_relation_types_admin_write"
  ON public.nexus_relation_types FOR ALL
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

INSERT INTO public.nexus_relation_types (code, label_pt, description, provisional, sort_order) VALUES
  ('citacao',      'Citação',      'Uma fonte cita literalmente a outra.',                                true, 1),
  ('paralelo',     'Paralelo',     'Passagens que se iluminam mutuamente sem citação direta.',            true, 2),
  ('comentario',   'Comentário',   'Uma fonte comenta ou explica a outra (patrística, magistério).',      true, 3),
  ('prefiguracao', 'Prefiguração', 'Tipologia AT→NT: figura veterotestamentária de realidade neotestamentária.', true, 4),
  ('condenacao',   'Condenação',   'Uma fonte magisterial condena tese/erro presente na outra.',          true, 5);

-- ============ 2. nexus_relations ============
CREATE TABLE public.nexus_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relation_type TEXT NOT NULL REFERENCES public.nexus_relation_types(code) ON UPDATE CASCADE,

  -- Âncora A (origem)
  source_kind TEXT NOT NULL CHECK (source_kind IN ('bible_verse','catechism_paragraph','magisterium_doc','patristic','other')),
  source_ref  JSONB NOT NULL, -- { abbrev, chapter, verse } | { paragraph } | { doc_id, section } ...

  -- Âncora B (destino)
  target_kind TEXT NOT NULL CHECK (target_kind IN ('bible_verse','catechism_paragraph','magisterium_doc','patristic','other')),
  target_ref  JSONB NOT NULL,

  -- Metadados (NUNCA como tipo)
  attributed_to TEXT,        -- ex.: "Santo Agostinho", "CIC 1994"
  note TEXT,
  confidence NUMERIC(3,2) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),

  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CHECK (NOT (source_kind = target_kind AND source_ref = target_ref))
);

GRANT SELECT ON public.nexus_relations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.nexus_relations TO authenticated;
GRANT ALL ON public.nexus_relations TO service_role;

ALTER TABLE public.nexus_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nexus_relations_read_all"
  ON public.nexus_relations FOR SELECT
  USING (true);

CREATE POLICY "nexus_relations_admin_write"
  ON public.nexus_relations FOR INSERT
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "nexus_relations_admin_update"
  ON public.nexus_relations FOR UPDATE
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "nexus_relations_admin_delete"
  ON public.nexus_relations FOR DELETE
  USING (public.is_current_user_admin());

-- Índices otimizados
CREATE INDEX idx_nexus_relations_type ON public.nexus_relations(relation_type);

-- Lookup por âncora bíblica (abbrev, chapter, verse) em source ou target
CREATE INDEX idx_nexus_relations_source_bible
  ON public.nexus_relations ((source_ref->>'abbrev'), ((source_ref->>'chapter')::int), ((source_ref->>'verse')::int))
  WHERE source_kind = 'bible_verse';

CREATE INDEX idx_nexus_relations_target_bible
  ON public.nexus_relations ((target_ref->>'abbrev'), ((target_ref->>'chapter')::int), ((target_ref->>'verse')::int))
  WHERE target_kind = 'bible_verse';

-- Lookup por parágrafo CIC
CREATE INDEX idx_nexus_relations_source_ccc
  ON public.nexus_relations (((source_ref->>'paragraph')::int))
  WHERE source_kind = 'catechism_paragraph';

CREATE INDEX idx_nexus_relations_target_ccc
  ON public.nexus_relations (((target_ref->>'paragraph')::int))
  WHERE target_kind = 'catechism_paragraph';

-- GIN fallback para queries arbitrárias em source_ref/target_ref
CREATE INDEX idx_nexus_relations_source_ref_gin ON public.nexus_relations USING GIN (source_ref);
CREATE INDEX idx_nexus_relations_target_ref_gin ON public.nexus_relations USING GIN (target_ref);

CREATE TRIGGER trg_nexus_relations_updated_at
  BEFORE UPDATE ON public.nexus_relations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_nexus_relation_types_updated_at
  BEFORE UPDATE ON public.nexus_relation_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 3. Multi-provedor + PCL-1.0 em bible_translation_sources ============
ALTER TABLE public.bible_translation_sources
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS pcl_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (pcl_status IN ('draft','submitted','validated','approved','active','suspended','revoked'));

CREATE INDEX IF NOT EXISTS idx_bible_translation_sources_provider ON public.bible_translation_sources(provider);
CREATE INDEX IF NOT EXISTS idx_bible_translation_sources_pcl_status ON public.bible_translation_sources(pcl_status);

-- Backfill: promover fontes já certificadas a 'active' (kill-switch = 'suspended'/'revoked')
UPDATE public.bible_translation_sources
   SET pcl_status = 'active'
 WHERE certified_at IS NOT NULL AND pcl_status = 'draft';

-- Função pública: valida se uma tradução pode ser lida (governança PCL-1.0)
CREATE OR REPLACE FUNCTION public.bible_translation_readable(p_translation_id UUID)
RETURNS TABLE(readable BOOLEAN, provider TEXT, pcl_status TEXT, reason TEXT)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_src public.bible_translation_sources%ROWTYPE;
BEGIN
  SELECT * INTO v_src FROM public.bible_translation_sources WHERE id = p_translation_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::text, NULL::text, 'translation_not_found'::text;
    RETURN;
  END IF;
  IF v_src.pcl_status <> 'active' THEN
    RETURN QUERY SELECT false, v_src.provider, v_src.pcl_status,
      ('pcl_blocked:' || v_src.pcl_status)::text;
    RETURN;
  END IF;
  RETURN QUERY SELECT true, v_src.provider, v_src.pcl_status, 'ok'::text;
END;
$$;

REVOKE ALL ON FUNCTION public.bible_translation_readable(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bible_translation_readable(UUID) TO anon, authenticated, service_role;
