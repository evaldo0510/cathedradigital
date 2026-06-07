-- Tabela de Feature Flags para Rollback Rápido
CREATE TABLE IF NOT EXISTS public.app_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir flag para soberania da bíblia (inicialmente desativada para segurança)
INSERT INTO public.app_feature_flags (feature_key, is_enabled, description)
VALUES ('bible_sovereignty_enabled', false, 'Ativa o uso exclusivo da base local para protocanônicos')
ON CONFLICT (feature_key) DO NOTHING;

-- Tabela de Cache L2 (Edge Cache Simulado no DB)
CREATE TABLE IF NOT EXISTS public.bible_cache_l2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL, -- Formato: v1:book:chapter
  content JSONB NOT NULL,
  hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_feature_flags TO authenticated;
GRANT ALL ON public.app_feature_flags TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bible_cache_l2 TO authenticated;
GRANT ALL ON public.bible_cache_l2 TO service_role;

-- RLS
ALTER TABLE public.app_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_cache_l2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read for feature flags" ON public.app_feature_flags FOR SELECT USING (true);
CREATE POLICY "Public read for L2 cache" ON public.bible_cache_l2 FOR SELECT USING (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cache_l2_expires ON public.bible_cache_l2(expires_at);
