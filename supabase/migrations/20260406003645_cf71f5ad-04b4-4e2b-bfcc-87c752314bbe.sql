CREATE TABLE public.trail_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trail_id TEXT NOT NULL,
  step_index INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, trail_id, step_index)
);

ALTER TABLE public.trail_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trail progress"
  ON public.trail_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trail progress"
  ON public.trail_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own trail progress"
  ON public.trail_progress FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_trail_progress_user ON public.trail_progress (user_id, trail_id);