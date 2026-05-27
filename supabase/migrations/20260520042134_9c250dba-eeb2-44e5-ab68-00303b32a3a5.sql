CREATE TABLE public.coming_soon_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    interest_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.coming_soon_leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for the coming soon form)
CREATE POLICY "Anyone can register interest" 
ON public.coming_soon_leads 
FOR INSERT 
WITH CHECK (true);

-- Allow admins to view leads
CREATE POLICY "Admins can view leads" 
ON public.coming_soon_leads 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
