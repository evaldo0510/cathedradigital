CREATE TYPE public.prayer_category AS ENUM (
  'fundamentais',
  'marianas',
  'espirito_santo',
  'santos',
  'antes_depois',
  'protecao',
  'momentos_do_dia',
  'eucaristica',
  'confissao_defuntos'
);

CREATE TABLE public.prayers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text NOT NULL UNIQUE,
  title           text NOT NULL,
  subtitle        text,
  kicker          text,
  category        public.prayer_category NOT NULL,
  content         text NOT NULL,
  content_latin   text,
  explanation     text,
  meditation      text,
  estimated_seconds integer NOT NULL DEFAULT 60,
  order_index     integer NOT NULL DEFAULT 0,
  tags            text[] NOT NULL DEFAULT '{}',
  source_ref      text,
  related_bible       text[] NOT NULL DEFAULT '{}',
  related_catechism   integer[] NOT NULL DEFAULT '{}',
  related_saints      text[] NOT NULL DEFAULT '{}',
  related_glossary    text[] NOT NULL DEFAULT '{}',
  is_published    boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX prayers_category_idx      ON public.prayers (category, order_index);
CREATE INDEX prayers_published_idx     ON public.prayers (is_published);
CREATE INDEX prayers_tags_gin_idx      ON public.prayers USING gin (tags);
CREATE INDEX prayers_title_trgm_idx    ON public.prayers USING gin (title gin_trgm_ops);

GRANT SELECT ON public.prayers TO anon, authenticated;
GRANT ALL    ON public.prayers TO service_role;

ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prayers_public_read_published"
  ON public.prayers
  FOR SELECT
  USING (is_published = true);

CREATE POLICY "prayers_admin_all"
  ON public.prayers
  FOR ALL
  TO authenticated
  USING (auth_internal.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER prayers_set_updated_at
  BEFORE UPDATE ON public.prayers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
