ALTER TABLE public.nexus_relations DROP CONSTRAINT IF EXISTS nexus_relations_source_kind_check;
ALTER TABLE public.nexus_relations DROP CONSTRAINT IF EXISTS nexus_relations_target_kind_check;
ALTER TABLE public.nexus_relations ADD CONSTRAINT nexus_relations_source_kind_check
  CHECK (source_kind = ANY (ARRAY['bible_verse','catechism_paragraph','magisterium_doc','patristic','saint','saint_work','glossary','prayer','journey','liturgy','other']));
ALTER TABLE public.nexus_relations ADD CONSTRAINT nexus_relations_target_kind_check
  CHECK (target_kind = ANY (ARRAY['bible_verse','catechism_paragraph','magisterium_doc','patristic','saint','saint_work','glossary','prayer','journey','liturgy','other']));