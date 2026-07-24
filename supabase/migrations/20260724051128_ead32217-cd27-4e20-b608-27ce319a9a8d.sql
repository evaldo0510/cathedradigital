
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Wrapper IMMUTABLE para permitir uso em generated columns / indexes
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public, extensions
AS $$ SELECT lower(extensions.unaccent('extensions.unaccent'::regdictionary, $1)) $$;

CREATE TABLE IF NOT EXISTS public.saint_aliases (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saint_id   text NOT NULL REFERENCES public.saints(id) ON DELETE CASCADE,
  alias      text NOT NULL,
  alias_norm text GENERATED ALWAYS AS (public.immutable_unaccent(alias)) STORED,
  language   text NOT NULL DEFAULT 'pt',
  type       text NOT NULL DEFAULT 'alt'
             CHECK (type IN ('birth_name','translation','popular','latin','alt','honorific')),
  source     text NOT NULL DEFAULT 'manual'
             CHECK (source IN ('manual','wikipedia','vatican','import')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (saint_id, alias_norm, language)
);

CREATE INDEX IF NOT EXISTS idx_saint_aliases_saint    ON public.saint_aliases(saint_id);
CREATE INDEX IF NOT EXISTS idx_saint_aliases_norm     ON public.saint_aliases(alias_norm);
CREATE INDEX IF NOT EXISTS idx_saint_aliases_language ON public.saint_aliases(language);

GRANT SELECT                          ON public.saint_aliases TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE  ON public.saint_aliases TO authenticated;
GRANT ALL                             ON public.saint_aliases TO service_role;

ALTER TABLE public.saint_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read saint aliases"
  ON public.saint_aliases FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "admins write saint aliases"
  ON public.saint_aliases FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role)
  );

CREATE POLICY "service role manages saint aliases"
  ON public.saint_aliases FOR ALL TO service_role USING (true) WITH CHECK (true);
