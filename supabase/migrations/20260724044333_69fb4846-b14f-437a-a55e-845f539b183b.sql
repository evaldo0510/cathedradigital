
ALTER TABLE public.saints
  ADD COLUMN IF NOT EXISTS conversion_story TEXT,
  ADD COLUMN IF NOT EXISTS mission TEXT,
  ADD COLUMN IF NOT EXISTS legacy TEXT;

CREATE TABLE IF NOT EXISTS public.saint_prayers_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  saint_id TEXT NOT NULL REFERENCES public.saints(id) ON DELETE CASCADE,
  prayer_id UUID NOT NULL REFERENCES public.prayers(id) ON DELETE CASCADE,
  relation TEXT NOT NULL DEFAULT 'by_saint',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (saint_id, prayer_id, relation)
);

CREATE INDEX IF NOT EXISTS idx_saint_prayers_links_saint ON public.saint_prayers_links(saint_id);
CREATE INDEX IF NOT EXISTS idx_saint_prayers_links_prayer ON public.saint_prayers_links(prayer_id);

GRANT SELECT ON public.saint_prayers_links TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.saint_prayers_links TO authenticated;
GRANT ALL ON public.saint_prayers_links TO service_role;

ALTER TABLE public.saint_prayers_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saint_prayers_links_public_read"
  ON public.saint_prayers_links FOR SELECT
  USING (true);

CREATE POLICY "saint_prayers_links_admin_write"
  ON public.saint_prayers_links FOR ALL
  TO authenticated
  USING (auth_internal.has_role(auth.uid(), 'admin'::public.app_role) OR auth_internal.has_role(auth.uid(), 'moderator'::public.app_role))
  WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::public.app_role) OR auth_internal.has_role(auth.uid(), 'moderator'::public.app_role));
