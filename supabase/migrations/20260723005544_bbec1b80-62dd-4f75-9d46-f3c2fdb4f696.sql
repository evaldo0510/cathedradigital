
-- Sprint 6.1 · Operação Ouro — peso doutrinário por verbete
ALTER TABLE public.glossary
  ADD COLUMN IF NOT EXISTS doctrinal_weight smallint NOT NULL DEFAULT 5
    CHECK (doctrinal_weight BETWEEN 1 AND 10);

COMMENT ON COLUMN public.glossary.doctrinal_weight IS
  'Peso doutrinário 1–10 usado no ICE ponderado. 10 = dogma central (Trindade, Eucaristia); 5 = padrão; 1–2 = periférico.';

-- Semear pesos dos verbetes fundamentais (idempotente via UPDATE)
UPDATE public.glossary SET doctrinal_weight = 10
  WHERE slug IN ('trindade','eucaristia','encarnacao','ressurreicao','cristologia','revelacao','graca','igreja');

UPDATE public.glossary SET doctrinal_weight = 9
  WHERE slug IN ('batismo','confirmacao','reconciliacao','confissao','ordem','matrimonio','uncao-dos-enfermos',
                 'fe','esperanca','caridade','espirito-santo','maria','salvacao','pecado','justificacao');

UPDATE public.glossary SET doctrinal_weight = 8
  WHERE slug IN ('escatologia','juizo','ceu','inferno','purgatorio','oracao','conversao','virtude',
                 'sacramento','magisterio','tradicao','biblia','logos','papa','bispo','martir','santo');

UPDATE public.glossary SET doctrinal_weight = 7
  WHERE slug IN ('vocacao','discernimento','ascese','contemplacao','mistica','liturgia','missa',
                 'rosario','via-sacra','indulgencia');

-- Índice para filtragem por peso
CREATE INDEX IF NOT EXISTS idx_glossary_doctrinal_weight
  ON public.glossary(doctrinal_weight DESC);
