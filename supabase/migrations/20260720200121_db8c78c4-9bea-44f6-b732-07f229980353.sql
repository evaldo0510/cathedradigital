ALTER TABLE public.glossary DISABLE TRIGGER trg_enforce_glossary_publish;

UPDATE public.glossary
SET status = 'published',
    published_at = COALESCE(published_at, now()),
    updated_at = now()
WHERE editorial_completeness = 'complete'
  AND status = 'draft'
  AND slug IN ('ceu','conversao','discernimento','encarnacao','inferno','juizo','oracao','purgatorio','ressurreicao','virtude','vocacao');

ALTER TABLE public.glossary ENABLE TRIGGER trg_enforce_glossary_publish;