-- Controle de Versão Global de Cache
INSERT INTO public.app_feature_flags (feature_key, is_enabled, description, metadata)
VALUES ('bible_cache_global_version', true, 'Versão atual do cache da Bíblia para invalidação forçada', '{"version": 1}'::jsonb)
ON CONFLICT (feature_key) DO NOTHING;

-- Melhoria na tabela de Cache L2 para suportar versão
ALTER TABLE public.bible_cache_l2 ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Melhoria na tabela de relatórios para capturar problemas de caracteres especiais
ALTER TABLE public.bible_integrity_reports ADD COLUMN IF NOT EXISTS encoding_issues_detected BOOLEAN DEFAULT false;
ALTER TABLE public.bible_integrity_reports ADD COLUMN IF NOT EXISTS special_chars_count INTEGER DEFAULT 0;
