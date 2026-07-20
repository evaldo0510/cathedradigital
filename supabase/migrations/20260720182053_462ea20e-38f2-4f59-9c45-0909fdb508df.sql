
ALTER TABLE public.glossary
  ADD COLUMN IF NOT EXISTS short_definition text,
  ADD COLUMN IF NOT EXISTS historical_context text,
  ADD COLUMN IF NOT EXISTS liturgy_refs text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS faq jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS logos_meditation text,
  ADD COLUMN IF NOT EXISTS next_steps jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS bibliography jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

COMMENT ON COLUMN public.glossary.short_definition IS 'Definição de uma frase — usada em previews, tooltips e cards.';
COMMENT ON COLUMN public.glossary.historical_context IS 'Contexto histórico do termo (origem, desenvolvimento doutrinal).';
COMMENT ON COLUMN public.glossary.liturgy_refs IS 'Referências litúrgicas (rito, missa, tempo litúrgico).';
COMMENT ON COLUMN public.glossary.faq IS 'JSON [{q, a}] de perguntas frequentes.';
COMMENT ON COLUMN public.glossary.logos_meditation IS 'Meditação contemplativa Logos (parágrafo espiritual).';
COMMENT ON COLUMN public.glossary.next_steps IS 'JSON [{label, href, kind}] de próximos passos.';
COMMENT ON COLUMN public.glossary.bibliography IS 'JSON [{author, title, year, url}] de fontes.';
COMMENT ON COLUMN public.glossary.version IS 'Versão editorial do verbete (incrementada a cada revisão publicada).';

-- Ampliar categorias suportadas (usamos check textual, sem enum, para permitir evolução).
-- Não impomos CHECK constraint restritiva; validação fica na UI/edge para não bloquear seeds.

-- Índice de busca por short_definition
CREATE INDEX IF NOT EXISTS idx_glossary_short_definition_trgm
  ON public.glossary USING gin (short_definition gin_trgm_ops)
  WHERE short_definition IS NOT NULL;

-- Índice para categoria (filtro A–Z + categoria é o hot path)
CREATE INDEX IF NOT EXISTS idx_glossary_category ON public.glossary (category)
  WHERE category IS NOT NULL;

-- Ordenação alfabética case-insensitive
CREATE INDEX IF NOT EXISTS idx_glossary_term_lower ON public.glossary (lower(term));
