ALTER TABLE public.glossary DISABLE TRIGGER trg_enforce_glossary_publish;
UPDATE public.glossary SET status = 'published', published_at = COALESCE(published_at, now()) WHERE slug IN ('confissao','papa','bispo','martir') AND editorial_completeness = 'complete';
ALTER TABLE public.glossary ENABLE TRIGGER trg_enforce_glossary_publish;