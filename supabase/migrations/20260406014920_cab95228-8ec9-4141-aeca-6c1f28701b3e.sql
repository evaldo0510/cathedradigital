
-- Journeys catalog
CREATE TABLE public.journeys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'compass',
  cover_url TEXT,
  category TEXT NOT NULL DEFAULT 'formacao',
  difficulty TEXT NOT NULL DEFAULT 'iniciante',
  estimated_days INTEGER NOT NULL DEFAULT 7,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Journeys are viewable by everyone"
  ON public.journeys FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage journeys"
  ON public.journeys FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Journey steps
CREATE TABLE public.journey_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  subtitle TEXT,
  step_type TEXT NOT NULL DEFAULT 'reading',
  content JSONB NOT NULL DEFAULT '{}',
  duration_minutes INTEGER NOT NULL DEFAULT 10,
  is_free BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.journey_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Journey steps are viewable by everyone"
  ON public.journey_steps FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage journey steps"
  ON public.journey_steps FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_journey_steps_journey ON public.journey_steps(journey_id, step_order);

-- Journey progress
CREATE TABLE public.journey_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  journey_id UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.journey_steps(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reflection TEXT,
  UNIQUE(user_id, step_id)
);

ALTER TABLE public.journey_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own journey progress"
  ON public.journey_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journey progress"
  ON public.journey_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own journey progress"
  ON public.journey_progress FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_journey_progress_user ON public.journey_progress(user_id, journey_id);

-- Spiritual journal
CREATE TABLE public.spiritual_journal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  content TEXT NOT NULL DEFAULT '',
  mood TEXT,
  journey_id UUID REFERENCES public.journeys(id) ON DELETE SET NULL,
  step_id UUID REFERENCES public.journey_steps(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.spiritual_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own journal"
  ON public.spiritual_journal FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own journal entries"
  ON public.spiritual_journal FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON public.spiritual_journal FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON public.spiritual_journal FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_journal_user_date ON public.spiritual_journal(user_id, entry_date DESC);

-- Add diagnosis_result to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS diagnosis_result JSONB;

-- Triggers for updated_at
CREATE TRIGGER update_journeys_updated_at
  BEFORE UPDATE ON public.journeys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journey_steps_updated_at
  BEFORE UPDATE ON public.journey_steps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_spiritual_journal_updated_at
  BEFORE UPDATE ON public.spiritual_journal
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
