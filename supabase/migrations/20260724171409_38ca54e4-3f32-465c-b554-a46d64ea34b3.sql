-- =====================================================================
-- P0.2.1 — Governança da tradução primária da Bíblia
--
-- 1. Rebaixa `figueiredo-1790` de primária (draft/draft não pode ser primária).
-- 2. Trigger `enforce_primary_translation_integrity`:
--       is_primary=true exige status='active' AND pcl_status='active'.
-- 3. Índice único parcial garante no máximo UMA primária.
-- 4. Função `get_active_primary_translation()` — fonte única da verdade.
-- =====================================================================

-- (1) Rebaixa primárias inválidas ANTES do trigger, para não bloquear a própria migração.
UPDATE public.bible_translation_sources
   SET is_primary = false
 WHERE is_primary = true
   AND (status <> 'active' OR pcl_status <> 'active');

-- (2) Trigger de integridade
CREATE OR REPLACE FUNCTION public.enforce_primary_translation_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_primary = true THEN
    IF NEW.status IS DISTINCT FROM 'active' THEN
      RAISE EXCEPTION
        'primary_translation_requires_active_status: tradução % (code=%) precisa de status=active para ser primária (atual: %)',
        NEW.id, NEW.code, NEW.status
        USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.pcl_status IS DISTINCT FROM 'active' THEN
      RAISE EXCEPTION
        'primary_translation_requires_active_pcl: tradução % (code=%) precisa de pcl_status=active para ser primária (atual: %)',
        NEW.id, NEW.code, NEW.pcl_status
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_primary_translation_integrity ON public.bible_translation_sources;
CREATE TRIGGER trg_enforce_primary_translation_integrity
  BEFORE INSERT OR UPDATE OF is_primary, status, pcl_status
  ON public.bible_translation_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_primary_translation_integrity();

-- (3) No máximo uma primária. Índice único parcial.
DROP INDEX IF EXISTS public.bible_translation_sources_only_one_primary;
CREATE UNIQUE INDEX bible_translation_sources_only_one_primary
  ON public.bible_translation_sources ((true))
  WHERE is_primary = true;

-- (4) Fonte única da verdade — RPC oficial.
-- Retorna 0 ou 1 linha. Nunca "silent-pick" de outra tradução.
CREATE OR REPLACE FUNCTION public.get_active_primary_translation()
RETURNS TABLE (
  id UUID,
  code TEXT,
  name TEXT,
  translation TEXT,
  status TEXT,
  pcl_status TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.code, s.name, s.translation, s.status, s.pcl_status
    FROM public.bible_translation_sources s
   WHERE s.is_primary = true
     AND s.status = 'active'
     AND s.pcl_status = 'active'
   LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_active_primary_translation() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_active_primary_translation() TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.get_active_primary_translation() IS
'P0.2.1 — Fonte única da verdade da tradução primária da Bíblia. Retorna a única tradução que satisfaz is_primary=true AND status=active AND pcl_status=active, ou nenhuma linha. Consumidores (Reader, Edge Functions, MCP, Nexus, IA, popovers) devem usar exclusivamente este helper — proibido select direto para "escolher" primária.';

COMMENT ON TRIGGER trg_enforce_primary_translation_integrity ON public.bible_translation_sources IS
'P0.2.1 — Impede que uma tradução seja marcada como is_primary=true sem status=active E pcl_status=active.';