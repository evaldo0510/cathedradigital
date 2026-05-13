-- Create nexus_synonyms table
CREATE TABLE public.nexus_synonyms (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    term TEXT NOT NULL UNIQUE,
    canonical_slug TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nexus_synonyms ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can read nexus synonyms" 
ON public.nexus_synonyms 
FOR SELECT 
USING (true);

-- For now, let's allow authenticated users to manage them if they have admin role
-- I'll check user_roles table to see how roles are handled
CREATE POLICY "Admins can manage nexus synonyms" 
ON public.nexus_synonyms 
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_nexus_synonyms_updated_at
BEFORE UPDATE ON public.nexus_synonyms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
