
-- Create table for user browsing history
CREATE TABLE public.user_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  route TEXT NOT NULL,
  title TEXT NOT NULL,
  image_url TEXT,
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own history"
  ON public.user_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history"
  ON public.user_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own history"
  ON public.user_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for fast queries
CREATE INDEX idx_user_history_user_visited ON public.user_history (user_id, visited_at DESC);
