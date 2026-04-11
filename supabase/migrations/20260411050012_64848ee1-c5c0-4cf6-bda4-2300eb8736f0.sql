-- Create themes table
CREATE TABLE public.themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create theme_contents table
CREATE TABLE public.theme_contents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  theme_id UUID NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('bible', 'catechism', 'magisterium')),
  reference TEXT NOT NULL, -- e.g., "João 3:16", "CIC 123", "Lumen Gentium 1"
  title TEXT, -- Optional title for the content
  text_content TEXT, -- The actual text snippet
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_contents ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Themes are viewable by everyone" ON public.themes FOR SELECT USING (true);
CREATE POLICY "Theme contents are viewable by everyone" ON public.theme_contents FOR SELECT USING (true);

-- Admin write access (simplified for now, usually role-based)
CREATE POLICY "Admins can manage themes" ON public.themes FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins can manage theme contents" ON public.theme_contents FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Create trigger for updated_at
CREATE TRIGGER update_themes_updated_at BEFORE UPDATE ON public.themes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_theme_contents_updated_at BEFORE UPDATE ON public.theme_contents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial themes
INSERT INTO public.themes (name, slug, description) VALUES
('Fé', 'fe', 'A virtude teologal pela qual cremos em Deus e em tudo o que Ele nos disse e revelou.'),
('Amor', 'amor', 'A maior das virtudes, a caridade que nos une a Deus e ao próximo.'),
('Pecado', 'pecado', 'A falta contra a razão, a verdade e a consciência reta; falha no amor verdadeiro para com Deus e o próximo.'),
('Graça', 'graca', 'O favor, o auxílio gratuito que Deus nos dá para responder a seu convite: tornar-nos filhos de Deus.'),
('Oração', 'oracao', 'A elevação da alma a Deus ou o pedido a Deus de bens convenientes.');

-- Insert some sample connections for "Fé"
WITH fe_id AS (SELECT id FROM public.themes WHERE slug = 'fe' LIMIT 1)
INSERT INTO public.theme_contents (theme_id, content_type, reference, title, text_content) VALUES
((SELECT id FROM fe_id), 'bible', 'Hebreus 11:1', 'Definição de Fé', 'Ora, a fé é o firme fundamento das coisas que se esperam, e a prova das coisas que se não veem.'),
((SELECT id FROM fe_id), 'catechism', 'CIC 153', 'A Graça da Fé', 'A fé é um dom de Deus, uma virtude sobrenatural infundida por Ele.'),
((SELECT id FROM fe_id), 'magisterium', 'Lumen Gentium 12', 'O Sentido da Fé', 'A universalidade dos fiéis, que têm a unção do Santo, não pode enganar-se no crer.');

-- Insert some sample connections for "Amor"
WITH amor_id AS (SELECT id FROM public.themes WHERE slug = 'amor' LIMIT 1)
INSERT INTO public.theme_contents (theme_id, content_type, reference, title, text_content) VALUES
((SELECT id FROM amor_id), 'bible', '1 Coríntios 13:4-7', 'O Hino ao Amor', 'O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha.'),
((SELECT id FROM amor_id), 'catechism', 'CIC 1822', 'A Caridade', 'A caridade é a virtude teologal pela qual amamos a Deus sobre todas as coisas e ao próximo como a nós mesmos por amor de Deus.'),
((SELECT id FROM amor_id), 'magisterium', 'Deus Caritas Est 1', 'Deus é Amor', '«Deus é amor: quem permanece no amor permanece em Deus e Deus nele» (1 Jo 4, 16).');
