-- CAT-13.1 (reenvio): unaccent vive no schema `extensions` no Supabase.
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

-- ---------- 1. GLOSSARY ----------
ALTER TABLE public.glossary
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS interpretation text,
  ADD COLUMN IF NOT EXISTS saints_refs text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS fathers_refs text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS prayer_refs text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS journey_refs uuid[] DEFAULT '{}'::uuid[],
  ADD COLUMN IF NOT EXISTS nexus_refs jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sections_order text[] DEFAULT ARRAY[
    'definition','interpretation','application','bible','catechism',
    'magisterium','saints','fathers','journey','prayer','nexus'
  ]::text[],
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='glossary_status_check') THEN
    ALTER TABLE public.glossary
      ADD CONSTRAINT glossary_status_check CHECK (status IN ('draft','review','published'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.slugify(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions, pg_catalog
AS $$
  SELECT trim(both '-' from
    regexp_replace(
      lower(extensions.unaccent(coalesce(input, ''))),
      '[^a-z0-9]+', '-', 'g'
    )
  );
$$;

WITH numbered AS (
  SELECT id, public.slugify(term) AS base_slug,
         ROW_NUMBER() OVER (PARTITION BY public.slugify(term) ORDER BY created_at) AS rn
  FROM public.glossary
  WHERE slug IS NULL OR slug = ''
)
UPDATE public.glossary g
SET slug = CASE WHEN n.rn = 1 THEN n.base_slug ELSE n.base_slug || '-' || n.rn END
FROM numbered n
WHERE g.id = n.id;

CREATE UNIQUE INDEX IF NOT EXISTS glossary_slug_key ON public.glossary(slug) WHERE slug IS NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='glossary' AND policyname='Admins can manage glossary'
  ) THEN
    CREATE POLICY "Admins can manage glossary"
      ON public.glossary FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- ---------- 2. JOURNEYS ----------
ALTER TABLE public.journeys
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS hero_kicker text,
  ADD COLUMN IF NOT EXISTS hero_quote text,
  ADD COLUMN IF NOT EXISTS hero_image_url text,
  ADD COLUMN IF NOT EXISTS narrative_intro text,
  ADD COLUMN IF NOT EXISTS closing_message text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='journeys_status_check') THEN
    ALTER TABLE public.journeys
      ADD CONSTRAINT journeys_status_check CHECK (status IN ('draft','review','published'));
  END IF;
END $$;

WITH numbered AS (
  SELECT id, public.slugify(title) AS base_slug,
         ROW_NUMBER() OVER (PARTITION BY public.slugify(title) ORDER BY created_at) AS rn
  FROM public.journeys
  WHERE slug IS NULL OR slug = ''
)
UPDATE public.journeys j
SET slug = CASE WHEN n.rn = 1 THEN n.base_slug ELSE n.base_slug || '-' || n.rn END
FROM numbered n
WHERE j.id = n.id;

CREATE UNIQUE INDEX IF NOT EXISTS journeys_slug_key ON public.journeys(slug) WHERE slug IS NOT NULL;

-- ---------- 3. JOURNEY_STEPS ----------
ALTER TABLE public.journey_steps
  ADD COLUMN IF NOT EXISTS reflection text,
  ADD COLUMN IF NOT EXISTS exercise text,
  ADD COLUMN IF NOT EXISTS closing text;

UPDATE public.journey_steps
SET
  reflection = COALESCE(reflection,
    NULLIF(content->>'padh',''),
    NULLIF(content->>'interpretation',''),
    NULLIF(content->>'reflection','')),
  exercise = COALESCE(exercise,
    NULLIF(content->>'practical_direction',''),
    NULLIF(content->>'guided_exercise',''),
    NULLIF(content->>'practice','')),
  closing = COALESCE(closing,
    NULLIF(content->>'closing',''),
    NULLIF(content->>'prayer',''))
WHERE reflection IS NULL OR exercise IS NULL OR closing IS NULL;

-- ---------- 4. NEXUS ----------
INSERT INTO public.nexus_relation_types (code, label_pt, description, provisional, sort_order)
VALUES ('glossary-term', 'Verbete do Léxico',
        'Relação entre um conteúdo e um verbete do Léxico Teológico.', false, 100)
ON CONFLICT (code) DO NOTHING;
