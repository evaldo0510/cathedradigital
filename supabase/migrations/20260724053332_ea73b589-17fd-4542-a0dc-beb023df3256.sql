
-- 1. Colunas de lifecycle
ALTER TABLE public.saints
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','merged','archived')),
  ADD COLUMN IF NOT EXISTS merged_into TEXT REFERENCES public.saints(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_saints_status_active
  ON public.saints(status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_saints_merged_into
  ON public.saints(merged_into) WHERE merged_into IS NOT NULL;

-- 2. Migrar dependências do registro vazio ('terezinha') para o canônico ('teresinha').
--    Aliases: usar ON CONFLICT DO NOTHING via delete-then-update para não violar UNIQUE.
UPDATE public.saint_aliases
   SET saint_id = 'teresinha'
 WHERE saint_id = 'terezinha'
   AND NOT EXISTS (
     SELECT 1 FROM public.saint_aliases a2
      WHERE a2.saint_id = 'teresinha'
        AND a2.alias = saint_aliases.alias
        AND a2.language = saint_aliases.language
   );
DELETE FROM public.saint_aliases WHERE saint_id = 'terezinha';

UPDATE public.saint_import_logs   SET saint_id = 'teresinha' WHERE saint_id = 'terezinha';
UPDATE public.saint_prayers_links SET saint_id = 'teresinha' WHERE saint_id = 'terezinha';
UPDATE public.saints_audit        SET saint_id = 'teresinha' WHERE saint_id = 'terezinha';

-- 3. Marcar duplicata como merged (preserva histórico)
UPDATE public.saints
   SET status = 'merged',
       merged_into = 'teresinha',
       updated_at = now()
 WHERE id = 'terezinha';

-- 4. Log de auditoria da operação de merge
INSERT INTO public.saint_import_logs (saint_id, provider, status, fields_updated, confidence, message)
VALUES (
  'teresinha',
  'cathedra-merge',
  'success',
  ARRAY['merged_from:terezinha'],
  100,
  'Sprint 3.1 — Entity Hygiene: registro duplicado terezinha marcado como merged. Aliases/logs/audit migrados.'
);
