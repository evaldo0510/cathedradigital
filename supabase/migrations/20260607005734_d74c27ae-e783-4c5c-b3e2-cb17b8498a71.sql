CREATE TABLE public.language_allowlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  term TEXT NOT NULL UNIQUE,
  description TEXT,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX idx_language_allowlist_term ON public.language_allowlist (term);

-- Standard permissions
GRANT SELECT ON public.language_allowlist TO authenticated;
GRANT ALL ON public.language_allowlist TO service_role;

-- RLS
ALTER TABLE public.language_allowlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read allowed terms" 
  ON public.language_allowlist FOR SELECT 
  TO authenticated 
  USING (true);

-- Seed initial terms
INSERT INTO public.language_allowlist (term, description) VALUES 
('Cathedra', 'Nome da plataforma'),
('Logos', 'Módulo de IA'),
('Nexus', 'Sistema de conexões'),
('Supabase', 'Provedor de Backend'),
('Google', 'Provedor de serviços'),
('GitHub', 'Plataforma de código'),
('PWA', 'Progressive Web App'),
('OLED', 'Tecnologia de tela'),
('GA4', 'Analytics');