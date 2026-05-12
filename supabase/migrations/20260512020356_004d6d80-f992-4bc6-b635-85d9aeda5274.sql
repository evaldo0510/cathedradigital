-- Create seo_settings table
CREATE TABLE public.seo_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    site_title TEXT NOT NULL DEFAULT 'Cathedra Digital',
    site_description TEXT,
    site_keywords TEXT,
    ga4_measurement_id TEXT,
    gsc_verification_code TEXT,
    og_image_url TEXT,
    twitter_handle TEXT,
    json_ld_schema JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create site_keywords table for strategic keywords management
CREATE TABLE public.site_keywords (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    keyword TEXT NOT NULL UNIQUE,
    priority INTEGER DEFAULT 0, -- 0: normal, 1: high, 2: critical
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_keywords ENABLE ROW LEVEL SECURITY;

-- Create policies for seo_settings
CREATE POLICY "Public can view SEO settings" ON public.seo_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage SEO settings" ON public.seo_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Create policies for site_keywords
CREATE POLICY "Public can view keywords" ON public.site_keywords
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage keywords" ON public.site_keywords
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Insert initial SEO settings if none exist
INSERT INTO public.seo_settings (site_title, site_description, site_keywords)
VALUES (
    'Cathedra Digital — Bíblia, Catecismo e Tradição Católica',
    'Aprofunde sua fé católica com Bíblia Sagrada, Catecismo da Igreja, vidas dos santos, liturgia diária e IA teológica. Tudo em uma plataforma unificada.',
    'bíblia católica online, catecismo online, liturgia diária online, santos do dia, oração diária, app católico gratuito, bíblia digital, jornada espiritual, magistério, dogmas católicos, rosário online'
) ON CONFLICT DO NOTHING;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_seo_settings_updated_at
BEFORE UPDATE ON public.seo_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_site_keywords_updated_at
BEFORE UPDATE ON public.site_keywords
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
