-- Create the private profiles table
CREATE TABLE IF NOT EXISTS public.profiles_private (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    whatsapp_number TEXT,
    whatsapp_enabled BOOLEAN DEFAULT false,
    push_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles_private ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own private profile"
ON public.profiles_private
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own private profile"
ON public.profiles_private
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all private profiles"
ON public.profiles_private
FOR SELECT
USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

-- Migration: Copy existing data
INSERT INTO public.profiles_private (id, whatsapp_number, whatsapp_enabled, push_enabled)
SELECT id, whatsapp_number, whatsapp_enabled, push_enabled
FROM public.profiles
ON CONFLICT (id) DO NOTHING;

-- Create trigger to automatically create private profile
CREATE OR REPLACE FUNCTION public.handle_new_profile_private()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles_private (id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_private
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_private();

-- Remove columns from the public profiles table
-- We'll keep them for a moment to avoid breaking the app until we update the code
-- But we will restrict the policy on the main table soon or just use the view
-- Actually, the best is to remove them now and update the code in the same step.
ALTER TABLE public.profiles DROP COLUMN whatsapp_number;
ALTER TABLE public.profiles DROP COLUMN whatsapp_enabled;
ALTER TABLE public.profiles DROP COLUMN push_enabled;
