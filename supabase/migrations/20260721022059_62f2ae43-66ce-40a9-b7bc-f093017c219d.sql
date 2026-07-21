
-- Fase B: Prayer Engine hierárquico

-- 1. prayers: coluna engine_version
ALTER TABLE public.prayers
  ADD COLUMN IF NOT EXISTS engine_version integer NOT NULL DEFAULT 1;

-- 2. prayer_sessions: posição hierárquica
ALTER TABLE public.prayer_sessions
  ADD COLUMN IF NOT EXISTS current_section_id uuid,
  ADD COLUMN IF NOT EXISTS current_mystery_id uuid,
  ADD COLUMN IF NOT EXISTS current_block_uuid uuid,
  ADD COLUMN IF NOT EXISTS completed_block_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[];

-- 3. prayer_sections
CREATE TABLE IF NOT EXISTS public.prayer_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_id uuid NOT NULL REFERENCES public.prayers(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  subtitle text,
  order_index integer NOT NULL DEFAULT 0,
  weekdays integer[] NOT NULL DEFAULT ARRAY[]::integer[],
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (prayer_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_prayer_sections_prayer ON public.prayer_sections(prayer_id, order_index);
GRANT SELECT ON public.prayer_sections TO anon, authenticated;
GRANT ALL ON public.prayer_sections TO service_role;
ALTER TABLE public.prayer_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prayer_sections_public_read" ON public.prayer_sections FOR SELECT USING (true);
CREATE POLICY "prayer_sections_admin_all" ON public.prayer_sections FOR ALL TO authenticated
  USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_prayer_sections_updated_at BEFORE UPDATE ON public.prayer_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. prayer_mysteries
CREATE TABLE IF NOT EXISTS public.prayer_mysteries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.prayer_sections(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  subtitle text,
  order_index integer NOT NULL DEFAULT 0,
  image_key text,
  gospel_ref text,
  gospel_text text,
  meditation text,
  fruit text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (section_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_prayer_mysteries_section ON public.prayer_mysteries(section_id, order_index);
GRANT SELECT ON public.prayer_mysteries TO anon, authenticated;
GRANT ALL ON public.prayer_mysteries TO service_role;
ALTER TABLE public.prayer_mysteries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prayer_mysteries_public_read" ON public.prayer_mysteries FOR SELECT USING (true);
CREATE POLICY "prayer_mysteries_admin_all" ON public.prayer_mysteries FOR ALL TO authenticated
  USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_prayer_mysteries_updated_at BEFORE UPDATE ON public.prayer_mysteries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. prayer_blocks
CREATE TABLE IF NOT EXISTS public.prayer_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_id uuid NOT NULL REFERENCES public.prayers(id) ON DELETE CASCADE,
  section_id uuid REFERENCES public.prayer_sections(id) ON DELETE CASCADE,
  mystery_id uuid REFERENCES public.prayer_mysteries(id) ON DELETE CASCADE,
  slug text,
  type text NOT NULL,
  title text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  repeat_count integer NOT NULL DEFAULT 1,
  audio_key text,
  order_index integer NOT NULL DEFAULT 0,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_prayer_blocks_prayer ON public.prayer_blocks(prayer_id, order_index);
CREATE INDEX IF NOT EXISTS idx_prayer_blocks_section ON public.prayer_blocks(section_id, order_index);
CREATE INDEX IF NOT EXISTS idx_prayer_blocks_mystery ON public.prayer_blocks(mystery_id, order_index);
GRANT SELECT ON public.prayer_blocks TO anon, authenticated;
GRANT ALL ON public.prayer_blocks TO service_role;
ALTER TABLE public.prayer_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prayer_blocks_public_read" ON public.prayer_blocks FOR SELECT USING (true);
CREATE POLICY "prayer_blocks_admin_all" ON public.prayer_blocks FOR ALL TO authenticated
  USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_prayer_blocks_updated_at BEFORE UPDATE ON public.prayer_blocks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. prayer_assets
CREATE TABLE IF NOT EXISTS public.prayer_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  kind text NOT NULL,
  url text NOT NULL,
  alt text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.prayer_assets TO anon, authenticated;
GRANT ALL ON public.prayer_assets TO service_role;
ALTER TABLE public.prayer_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prayer_assets_public_read" ON public.prayer_assets FOR SELECT USING (true);
CREATE POLICY "prayer_assets_admin_all" ON public.prayer_assets FOR ALL TO authenticated
  USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_prayer_assets_updated_at BEFORE UPDATE ON public.prayer_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. prayer_references
CREATE TABLE IF NOT EXISTS public.prayer_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id uuid REFERENCES public.prayer_blocks(id) ON DELETE CASCADE,
  mystery_id uuid REFERENCES public.prayer_mysteries(id) ON DELETE CASCADE,
  kind text NOT NULL,
  ref text NOT NULL,
  label text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_prayer_references_block ON public.prayer_references(block_id);
CREATE INDEX IF NOT EXISTS idx_prayer_references_mystery ON public.prayer_references(mystery_id);
GRANT SELECT ON public.prayer_references TO anon, authenticated;
GRANT ALL ON public.prayer_references TO service_role;
ALTER TABLE public.prayer_references ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prayer_references_public_read" ON public.prayer_references FOR SELECT USING (true);
CREATE POLICY "prayer_references_admin_all" ON public.prayer_references FOR ALL TO authenticated
  USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));
