import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SEOSettings {
  id: string;
  site_title: string;
  site_description: string;
  site_keywords: string;
  ga4_measurement_id?: string;
  gsc_verification_code?: string;
  og_image_url?: string;
  twitter_handle?: string;
  json_ld_schema?: any;
  business_name?: string;
  business_address?: string;
  business_phone?: string;
  business_whatsapp?: string;
  business_email?: string;
  google_maps_url?: string;
  latitude?: number;
  longitude?: number;
  opening_hours?: string;
}

export const useSEO = () => {
  return useQuery({
    queryKey: ['seo-settings'],
    queryFn: async () => {
      // Use the public-safe view that excludes sensitive credentials
      // (ga4_measurement_id, gsc_verification_code). Admin tooling reads
      // the underlying seo_settings table directly under RLS.
      const { data, error } = await supabase
        .from('public_seo_settings' as any)
        .select('*')
        .maybeSingle();

      if (error) throw error;
      return data as unknown as SEOSettings;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useKeywords = () => {
  return useQuery({
    queryKey: ['site-keywords'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_keywords')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
