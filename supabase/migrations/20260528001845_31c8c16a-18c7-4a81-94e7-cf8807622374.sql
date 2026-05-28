-- Create achievements table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- emoji or icon name
  category TEXT NOT NULL, -- 'itineraria', 'catechism', 'bible', etc.
  requirement_type TEXT NOT NULL, -- 'steps_completed', 'trail_finished', 'streak_days', etc.
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Create user_reminder_settings table
CREATE TABLE public.user_reminder_settings (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  reminder_frequency TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'weekly'
  reminder_time TIME NOT NULL DEFAULT '09:00:00',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reminder_settings ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT ON public.achievements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_achievements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_reminder_settings TO authenticated;
GRANT ALL ON public.achievements TO service_role;
GRANT ALL ON public.user_achievements TO service_role;
GRANT ALL ON public.user_reminder_settings TO service_role;

-- Policies
CREATE POLICY "Achievements are viewable by everyone" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own reminder settings" ON public.user_reminder_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own reminder settings" ON public.user_reminder_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reminder settings" ON public.user_reminder_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable real-time (careful with existing tables)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'itineraria_progress') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.itineraria_progress;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'user_achievements') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_achievements;
  END IF;
END $$;

-- Seed some initial achievements
INSERT INTO public.achievements (name, description, icon, category, requirement_type, requirement_value) VALUES
('Primeiro Passo', 'Completou o seu primeiro passo em uma trilha espiritual.', '🚶', 'itineraria', 'steps_completed', 1),
('Caminhante Constante', 'Completou 10 passos em trilhas espirituais.', '👣', 'itineraria', 'steps_completed', 10),
('Mestre do Silêncio', 'Completou sua primeira trilha espiritual inteira.', '🧘', 'itineraria', 'trail_finished', 1),
('Perseverança', 'Manteve uma meta semanal por 4 semanas seguidas.', '⏳', 'itineraria', 'streak_weeks', 4);
