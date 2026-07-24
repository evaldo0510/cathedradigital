
-- Helper role check (se ainda não existe)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

DO $$ BEGIN
  CREATE TYPE public.saint_work_category AS ENUM (
    'patristica','escolastica','mistica','monastica','carmelita','franciscana','dominicana','doutor','espiritualidade','apologetica','liturgica'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.saint_work_status AS ENUM ('draft','in_review','published','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Adiciona 'editor' e 'reviewer' ao enum app_role se ainda não existirem
DO $$ BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'editor'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'reviewer'; EXCEPTION WHEN others THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.saint_works (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  saint_id TEXT NOT NULL REFERENCES public.saints(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  original_title TEXT,
  language TEXT NOT NULL DEFAULT 'pt-BR',
  original_language TEXT,
  category public.saint_work_category NOT NULL DEFAULT 'espiritualidade',
  year_written INTEGER,
  abstract TEXT,
  cover_image_url TEXT,
  is_public_domain BOOLEAN NOT NULL DEFAULT false,
  license TEXT,
  source_url TEXT,
  translation_credit TEXT,
  status public.saint_work_status NOT NULL DEFAULT 'draft',
  editorial_score INTEGER NOT NULL DEFAULT 0 CHECK (editorial_score BETWEEN 0 AND 100),
  chapter_count INTEGER NOT NULL DEFAULT 0,
  total_reading_minutes INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  CONSTRAINT saint_works_slug_unique UNIQUE (saint_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_saint_works_saint ON public.saint_works(saint_id);
CREATE INDEX IF NOT EXISTS idx_saint_works_status ON public.saint_works(status);
CREATE INDEX IF NOT EXISTS idx_saint_works_category ON public.saint_works(category);
CREATE INDEX IF NOT EXISTS idx_saint_works_slug ON public.saint_works(slug);

GRANT SELECT ON public.saint_works TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saint_works TO authenticated;
GRANT ALL ON public.saint_works TO service_role;

ALTER TABLE public.saint_works ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saint_works_public_read_published" ON public.saint_works FOR SELECT USING (status='published');
CREATE POLICY "saint_works_admins_all" ON public.saint_works FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));

CREATE TABLE IF NOT EXISTS public.saint_work_chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_id UUID NOT NULL REFERENCES public.saint_works(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  body_html TEXT NOT NULL,
  body_plain TEXT NOT NULL DEFAULT '',
  reading_minutes INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT saint_work_chapters_unique_order UNIQUE (work_id, "order")
);

CREATE INDEX IF NOT EXISTS idx_saint_work_chapters_work ON public.saint_work_chapters(work_id, "order");
CREATE INDEX IF NOT EXISTS idx_saint_work_chapters_search ON public.saint_work_chapters USING GIN (to_tsvector('portuguese', body_plain));

GRANT SELECT ON public.saint_work_chapters TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saint_work_chapters TO authenticated;
GRANT ALL ON public.saint_work_chapters TO service_role;

ALTER TABLE public.saint_work_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saint_work_chapters_public_read_published" ON public.saint_work_chapters FOR SELECT
USING (EXISTS (SELECT 1 FROM public.saint_works w WHERE w.id = work_id AND w.status='published'));

CREATE POLICY "saint_work_chapters_admins_all" ON public.saint_work_chapters FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.saint_works_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_saint_works_updated_at ON public.saint_works;
CREATE TRIGGER trg_saint_works_updated_at BEFORE UPDATE ON public.saint_works
FOR EACH ROW EXECUTE FUNCTION public.saint_works_touch_updated_at();

DROP TRIGGER IF EXISTS trg_saint_work_chapters_updated_at ON public.saint_work_chapters;
CREATE TRIGGER trg_saint_work_chapters_updated_at BEFORE UPDATE ON public.saint_work_chapters
FOR EACH ROW EXECUTE FUNCTION public.saint_works_touch_updated_at();

CREATE OR REPLACE FUNCTION public.saint_works_license_gate()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'published' THEN
    IF NEW.license IS NULL OR length(trim(NEW.license)) = 0 THEN
      RAISE EXCEPTION 'saint_works.license é obrigatória para publicar (Editorial License Rule)';
    END IF;
    IF NEW.published_at IS NULL THEN NEW.published_at := now(); END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_saint_works_license_gate ON public.saint_works;
CREATE TRIGGER trg_saint_works_license_gate BEFORE INSERT OR UPDATE ON public.saint_works
FOR EACH ROW EXECUTE FUNCTION public.saint_works_license_gate();

CREATE OR REPLACE FUNCTION public.saint_works_refresh_counters()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE target UUID;
BEGIN
  target := COALESCE(NEW.work_id, OLD.work_id);
  UPDATE public.saint_works w
  SET chapter_count = (SELECT count(*) FROM public.saint_work_chapters c WHERE c.work_id = target),
      total_reading_minutes = COALESCE((SELECT sum(reading_minutes) FROM public.saint_work_chapters c WHERE c.work_id = target), 0)
  WHERE w.id = target;
  RETURN NULL;
END; $$;

DROP TRIGGER IF EXISTS trg_saint_work_chapters_refresh ON public.saint_work_chapters;
CREATE TRIGGER trg_saint_work_chapters_refresh AFTER INSERT OR UPDATE OR DELETE ON public.saint_work_chapters
FOR EACH ROW EXECUTE FUNCTION public.saint_works_refresh_counters();
