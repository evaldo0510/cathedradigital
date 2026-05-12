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
}

export const useSEO = () => {
  return useQuery({
    queryKey: ['seo-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seo_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      return data as SEOSettings;
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
