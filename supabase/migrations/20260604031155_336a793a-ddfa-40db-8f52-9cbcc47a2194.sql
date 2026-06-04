ALTER TABLE public.secret_leaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own leaks" 
ON public.secret_leaks 
FOR SELECT 
USING (auth.uid() = (details->>'user_id')::uuid OR (details->>'user_id') IS NULL);
