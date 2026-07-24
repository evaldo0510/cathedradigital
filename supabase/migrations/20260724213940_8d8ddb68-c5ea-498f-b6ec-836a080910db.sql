
-- 1. Consolidação de slugs legados
BEGIN;

WITH pairs(legacy_slug, canonical_slug) AS (
  VALUES
    ('s-agostinho-0828', 'agostinho'),
    ('s-agostinho-0527', 'agostinho'),
    ('s-alberto-magno-1115', 'alberto-magno'),
    ('s-ambrosio-1207', 'ambrosio'),
    ('s-anselmo-0421', 'anselmo'),
    ('s-anselmo-0318', 'anselmo'),
    ('s-atanasio-0502', 'atanasio'),
    ('s-bernardo-0820', 'bernardo'),
    ('s-efrem-0609', 'efrem'),
    ('s-gregorio-magno-0903', 'gregorio-magno'),
    ('s-jeronimo-0930', 'jeronimo'),
    ('s-joao-crisostomo-0913', 'joao-crisostomo'),
    ('s-joao-damasceno-1204', 'joao-damasceno'),
    ('s-leao-magno-1110', 'leao-magno'),
    ('s-pedro-crisologo-0730', 'pedro-crisologo'),
    ('s-pedro-damiao-0221', 'pedro-damiao'),
    ('s-roberto-belarmino-0917', 'roberto-belarmino'),
    ('s-ireneu-0628', 'ireneu-lyon'),
    ('s-isidoro-0404', 'isidoro-sevilha')
)
UPDATE public.saints s
SET merged_into = p.canonical_slug,
    editorial_status = 'archived',
    updated_at = now()
FROM pairs p
WHERE s.id = p.legacy_slug
  AND (s.merged_into IS NULL OR s.merged_into = '');

-- Auditoria em saints_audit (best-effort; se schema divergir, apenas ignora)
DO $$
BEGIN
  INSERT INTO public.saints_audit (saint_id, action, changed_fields, actor, reason)
  SELECT p.legacy_slug,
         'merge',
         jsonb_build_object('merged_into', p.canonical_slug, 'editorial_status', 'archived'),
         'system:sprint-s2-hygiene',
         'Sprint Santos S2 · consolidação de doutores duplicados'
  FROM (VALUES
    ('s-agostinho-0828', 'agostinho'),
    ('s-agostinho-0527', 'agostinho'),
    ('s-alberto-magno-1115', 'alberto-magno'),
    ('s-ambrosio-1207', 'ambrosio'),
    ('s-anselmo-0421', 'anselmo'),
    ('s-anselmo-0318', 'anselmo'),
    ('s-atanasio-0502', 'atanasio'),
    ('s-bernardo-0820', 'bernardo'),
    ('s-efrem-0609', 'efrem'),
    ('s-gregorio-magno-0903', 'gregorio-magno'),
    ('s-jeronimo-0930', 'jeronimo'),
    ('s-joao-crisostomo-0913', 'joao-crisostomo'),
    ('s-joao-damasceno-1204', 'joao-damasceno'),
    ('s-leao-magno-1110', 'leao-magno'),
    ('s-pedro-crisologo-0730', 'pedro-crisologo'),
    ('s-pedro-damiao-0221', 'pedro-damiao'),
    ('s-roberto-belarmino-0917', 'roberto-belarmino'),
    ('s-ireneu-0628', 'ireneu-lyon'),
    ('s-isidoro-0404', 'isidoro-sevilha')
  ) AS p(legacy_slug, canonical_slug);
EXCEPTION WHEN undefined_table OR undefined_column THEN
  RAISE NOTICE 'saints_audit indisponível; pulando auditoria.';
END $$;

COMMIT;

-- 2. Ampliação de saint_import_logs para rastrear redirecionamentos
ALTER TABLE public.saint_import_logs
  ADD COLUMN IF NOT EXISTS redirected_from TEXT,
  ADD COLUMN IF NOT EXISTS canonical_id TEXT;

COMMENT ON COLUMN public.saint_import_logs.redirected_from IS
  'Slug legado solicitado pelo caller quando a ingestão foi redirecionada ao canônico via merged_into.';
COMMENT ON COLUMN public.saint_import_logs.canonical_id IS
  'Slug canônico efetivamente enriquecido nesta run (COALESCE(saints.merged_into, saint_id)).';

CREATE INDEX IF NOT EXISTS idx_saint_import_logs_redirected_from
  ON public.saint_import_logs (redirected_from) WHERE redirected_from IS NOT NULL;
