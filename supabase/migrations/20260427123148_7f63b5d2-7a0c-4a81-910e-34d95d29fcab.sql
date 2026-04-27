-- Add columns to catechism_cache
ALTER TABLE public.catechism_cache 
ADD COLUMN IF NOT EXISTS texto_base TEXT,
ADD COLUMN IF NOT EXISTS explicacao TEXT,
ADD COLUMN IF NOT EXISTS interpretacao_profunda TEXT,
ADD COLUMN IF NOT EXISTS aplicacao_pratica TEXT,
ADD COLUMN IF NOT EXISTS reflexao_final TEXT,
ADD COLUMN IF NOT EXISTS exercicio TEXT;

-- Add columns to catechism_official
ALTER TABLE public.catechism_official 
ADD COLUMN IF NOT EXISTS texto_base TEXT,
ADD COLUMN IF NOT EXISTS explicacao TEXT,
ADD COLUMN IF NOT EXISTS interpretacao_profunda TEXT,
ADD COLUMN IF NOT EXISTS aplicacao_pratica TEXT,
ADD COLUMN IF NOT EXISTS reflexao_final TEXT,
ADD COLUMN IF NOT EXISTS exercicio TEXT;