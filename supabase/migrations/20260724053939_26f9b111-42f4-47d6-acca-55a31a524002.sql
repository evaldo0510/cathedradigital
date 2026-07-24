ALTER TABLE public.saints
  ADD COLUMN IF NOT EXISTS spirituality_summary text,
  ADD COLUMN IF NOT EXISTS key_events jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Proteger novos campos contra sobrescrita pelo importador Wikipedia/Vatican.
ALTER TABLE public.saints
  ALTER COLUMN protected_fields SET DEFAULT ARRAY[
    'ai_reflection',
    'spiritual_practice',
    'conversion_story',
    'mission',
    'legacy',
    'prayer',
    'quotes_rich',
    'biography_full',
    'spirituality_summary',
    'key_events',
    'historical_context',
    'timeline',
    'curiosities'
  ]::text[];

-- Backfill: adiciona os novos campos protegidos para os santos existentes,
-- preservando qualquer proteção customizada que já exista.
UPDATE public.saints
SET protected_fields = ARRAY(
  SELECT DISTINCT unnest(
    protected_fields || ARRAY[
      'spirituality_summary',
      'key_events',
      'historical_context',
      'timeline',
      'curiosities'
    ]::text[]
  )
)
WHERE NOT (protected_fields @> ARRAY['spirituality_summary','key_events']::text[]);

COMMENT ON COLUMN public.saints.spirituality_summary IS 'Resumo editorial da espiritualidade/carisma do santo (2-3 parágrafos).';
COMMENT ON COLUMN public.saints.key_events IS 'Array de eventos-chave: [{year, title, description, source?}].';