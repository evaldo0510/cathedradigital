-- Create partners table
CREATE TABLE public.partners (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    contact_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Public can view approved partners" 
ON public.partners 
FOR SELECT 
USING (status = 'approved');

-- Create policies for partner registration
CREATE POLICY "Anyone can submit a partnership request" 
ON public.partners 
FOR INSERT 
WITH CHECK (status = 'pending');

-- Create policies for admin management
CREATE POLICY "Admins can manage partners" 
ON public.partners 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_partners_updated_at
BEFORE UPDATE ON public.partners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();