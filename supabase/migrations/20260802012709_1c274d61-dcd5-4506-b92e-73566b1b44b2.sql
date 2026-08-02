
CREATE OR REPLACE FUNCTION public.nexus_normalize_kind(_kind text, _ref jsonb)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _kind IS DISTINCT FROM 'other' THEN _kind
    WHEN _ref ? 'kind' THEN CASE _ref->>'kind'
      WHEN 'bible' THEN 'bible_verse'
      WHEN 'bible_verse' THEN 'bible_verse'
      WHEN 'catechism' THEN 'catechism_paragraph'
      WHEN 'catechism_paragraph' THEN 'catechism_paragraph'
      WHEN 'magisterium' THEN 'magisterium_doc'
      WHEN 'magisterium_doc' THEN 'magisterium_doc'
      WHEN 'father' THEN 'patristic'
      WHEN 'patristic' THEN 'patristic'
      WHEN 'saint' THEN 'saint'
      WHEN 'saint_work' THEN 'saint_work'
      WHEN 'glossary' THEN 'glossary'
      WHEN 'prayer' THEN 'prayer'
      WHEN 'journey' THEN 'journey'
      WHEN 'liturgy' THEN 'liturgy'
      ELSE 'other'
    END
    ELSE 'other'
  END
$$;

UPDATE public.nexus_relations
SET source_kind = public.nexus_normalize_kind(source_kind, source_ref),
    target_kind = public.nexus_normalize_kind(target_kind, target_ref)
WHERE source_kind = 'other' OR target_kind = 'other';

CREATE OR REPLACE FUNCTION public.nexus_relations_normalize_trg()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.source_kind := public.nexus_normalize_kind(NEW.source_kind, NEW.source_ref);
  NEW.target_kind := public.nexus_normalize_kind(NEW.target_kind, NEW.target_ref);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS nexus_relations_normalize ON public.nexus_relations;
CREATE TRIGGER nexus_relations_normalize
BEFORE INSERT OR UPDATE ON public.nexus_relations
FOR EACH ROW EXECUTE FUNCTION public.nexus_relations_normalize_trg();

CREATE INDEX IF NOT EXISTS nexus_relations_source_lookup_idx
  ON public.nexus_relations (source_kind, (COALESCE(source_ref->>'slug', source_ref->>'id', source_ref->>'ref')));
CREATE INDEX IF NOT EXISTS nexus_relations_target_lookup_idx
  ON public.nexus_relations (target_kind, (COALESCE(target_ref->>'slug', target_ref->>'id', target_ref->>'ref')));
