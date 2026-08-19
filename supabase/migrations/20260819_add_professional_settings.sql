-- Adiciona campos de personalização profissional ao perfil
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS professional_name TEXT,
ADD COLUMN IF NOT EXISTS professional_brand_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS show_professional_card BOOLEAN DEFAULT true;

-- Grants já devem existir para authenticated em profiles, mas garantindo acesso aos novos campos
GRANT UPDATE(professional_name, professional_brand_url, instagram_url, show_professional_card) ON public.profiles TO authenticated;
