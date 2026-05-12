-- Set search_path for the updated_at function
ALTER FUNCTION public.handle_updated_at() SET search_path = public;

-- Insert strategic initial keywords
INSERT INTO public.site_keywords (keyword, priority) VALUES
('bíblia católica online', 2),
('catecismo da igreja católica', 2),
('liturgia diária', 1),
('santo do dia', 1),
('oração católica', 1),
('estudo teológico', 1),
('cathedra digital', 2),
('ia católica', 1),
('catolicismo', 0),
('fé cristã', 0)
ON CONFLICT (keyword) DO NOTHING;
