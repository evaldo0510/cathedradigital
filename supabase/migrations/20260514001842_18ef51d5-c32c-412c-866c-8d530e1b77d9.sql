-- Table for SEO audits
CREATE TABLE IF NOT EXISTS public.seo_audits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    url TEXT NOT NULL,
    score INTEGER,
    findings JSONB NOT NULL DEFAULT '[]',
    meta_tags JSONB NOT NULL DEFAULT '{}',
    headings JSONB NOT NULL DEFAULT '{}',
    links JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seo_audits ENABLE ROW LEVEL SECURITY;

-- Policies for seo_audits
CREATE POLICY "Admins can manage seo_audits" 
ON public.seo_audits 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Table for SEO corrections
CREATE TABLE IF NOT EXISTS public.seo_corrections (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    audit_id UUID REFERENCES public.seo_audits(id) ON DELETE CASCADE,
    issue_type TEXT NOT NULL,
    issue_details TEXT,
    applied_correction TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, applied, skipped
    applied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seo_corrections ENABLE ROW LEVEL SECURITY;

-- Policies for seo_corrections
CREATE POLICY "Admins can manage seo_corrections" 
ON public.seo_corrections 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Update seo_settings if it doesn't have some expected columns (though AdminSeoTab suggests it exists)
-- This is just to ensure it exists for our code
CREATE TABLE IF NOT EXISTS public.seo_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    site_title TEXT,
    site_description TEXT,
    business_name TEXT,
    business_email TEXT,
    business_address TEXT,
    opening_hours TEXT,
    business_whatsapp TEXT,
    business_phone TEXT,
    google_maps_url TEXT,
    gsc_verification_code TEXT,
    ga4_measurement_id TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage seo_settings" ON public.seo_settings FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Public can view seo_settings" ON public.seo_settings FOR SELECT USING (true);
