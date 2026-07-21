
CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  cover TEXT,
  category TEXT NOT NULL DEFAULT 'sacramentos',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  featured BOOLEAN NOT NULL DEFAULT false,
  nexus_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.collections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO authenticated;
GRANT ALL ON public.collections TO service_role;

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public reads published collections"
  ON public.collections FOR SELECT
  USING (status = 'published' OR auth_internal.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins manage collections"
  ON public.collections FOR ALL
  USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('glossary','prayer','saint','bible','liturgy','catechism','journey')),
  item_slug TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  title_override TEXT,
  description_override TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(collection_id, item_type, item_slug)
);

CREATE INDEX idx_collection_items_collection ON public.collection_items(collection_id, order_index);

GRANT SELECT ON public.collection_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collection_items TO authenticated;
GRANT ALL ON public.collection_items TO service_role;

ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public reads items of published collections"
  ON public.collection_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_items.collection_id
        AND (c.status = 'published' OR auth_internal.has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "admins manage collection items"
  ON public.collection_items FOR ALL
  USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.collection_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.collection_items(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','reading','meditating','completed')),
  last_position JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);

CREATE INDEX idx_collection_progress_user_coll ON public.collection_progress(user_id, collection_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.collection_progress TO authenticated;
GRANT ALL ON public.collection_progress TO service_role;

ALTER TABLE public.collection_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own progress"
  ON public.collection_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_collections_updated
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_collection_items_updated
  BEFORE UPDATE ON public.collection_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_collection_progress_updated
  BEFORE UPDATE ON public.collection_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.collections (slug, title, subtitle, description, category, status, featured, metadata)
VALUES (
  'sete-sacramentos',
  'Os Sete Sacramentos',
  'Caminho de encontro entre Deus e o homem.',
  'Os sete sinais eficazes da graça, instituídos por Cristo e confiados à Igreja, através dos quais nos é dispensada a vida divina.',
  'sacramentos',
  'published',
  true,
  jsonb_build_object('space','church','eyebrow','MISTÉRIO DA GRAÇA')
);

WITH c AS (SELECT id FROM public.collections WHERE slug = 'sete-sacramentos')
INSERT INTO public.collection_items (collection_id, item_type, item_slug, order_index, metadata)
SELECT c.id, 'glossary', v.slug, v.ord, v.meta::jsonb FROM c,
(VALUES
  ('batismo', 1, '{"symbol":"droplet","short":"Porta da vida cristã, renascimento pela água e pelo Espírito."}'),
  ('crisma', 2, '{"symbol":"flame","short":"Selo do Espírito Santo, fortaleza para testemunhar."}'),
  ('eucaristia', 3, '{"symbol":"wheat","short":"Fonte e ápice da vida cristã, corpo e sangue de Cristo."}'),
  ('confissao', 4, '{"symbol":"heart-handshake","short":"Reconciliação com Deus e com a Igreja."}'),
  ('uncao-dos-enfermos', 5, '{"symbol":"hand-heart","short":"Consolo e força na enfermidade grave."}'),
  ('ordem', 6, '{"symbol":"church","short":"Sacramento do serviço apostólico."}'),
  ('matrimonio', 7, '{"symbol":"rings","short":"Aliança de amor e fecundidade entre os esposos."}')
) AS v(slug, ord, meta);
