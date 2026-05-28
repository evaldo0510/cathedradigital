-- Tabela principal de Trilhas Espirituais (Itineraria)
CREATE TABLE public.itineraria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  icon TEXT DEFAULT 'compass',
  cover_url TEXT,
  category TEXT DEFAULT 'caminhada',
  difficulty TEXT DEFAULT 'iniciante',
  estimated_days INTEGER DEFAULT 7,
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Passos de cada trilha
CREATE TABLE public.itineraria_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  itinerarium_id UUID NOT NULL REFERENCES public.itineraria(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  step_type TEXT NOT NULL DEFAULT 'contemplation', -- 'reading', 'catechism', 'logos_ai', 'prayer', 'reflection'
  step_order INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER DEFAULT 5,
  is_free BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Progresso do usuário nas trilhas
CREATE TABLE public.itineraria_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  itinerarium_id UUID NOT NULL REFERENCES public.itineraria(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.itineraria_steps(id) ON DELETE CASCADE,
  reflection TEXT,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, step_id)
);

-- Grants
GRANT SELECT ON public.itineraria TO anon, authenticated;
GRANT SELECT ON public.itineraria_steps TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.itineraria_progress TO authenticated;
GRANT ALL ON public.itineraria TO service_role;
GRANT ALL ON public.itineraria_steps TO service_role;
GRANT ALL ON public.itineraria_progress TO service_role;

-- RLS
ALTER TABLE public.itineraria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraria_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraria_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Itineraria are viewable by everyone" ON public.itineraria FOR SELECT USING (is_active = true);
CREATE POLICY "Itineraria steps are viewable by everyone" ON public.itineraria_steps FOR SELECT USING (true);
CREATE POLICY "Users can view their own itineraria progress" ON public.itineraria_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own itineraria progress" ON public.itineraria_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own itineraria progress" ON public.itineraria_progress FOR UPDATE USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_itineraria_updated_at BEFORE UPDATE ON public.itineraria FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_itineraria_steps_updated_at BEFORE UPDATE ON public.itineraria_steps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- View para estatísticas de progresso (facilitando o frontend)
CREATE OR REPLACE VIEW public.view_itineraria_with_stats AS
SELECT 
    i.*,
    (SELECT count(*) FROM public.itineraria_steps s WHERE s.itinerarium_id = i.id) as steps_count
FROM public.itineraria i;

GRANT SELECT ON public.view_itineraria_with_stats TO anon, authenticated;
