import { onCLS, onLCP, onFCP, onTTFB, onINP, Metric } from 'web-vitals';
import { supabase } from '@/integrations/supabase/client';

const sendToAnalytics = async (metric: Metric) => {
  const body = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    metric_id: metric.id,
    navigation_type: metric.navigationType,
    path: window.location.pathname,
    timestamp: new Date().toISOString()
  };

  try {
    // Usando any para ignorar temporariamente os erros de tipo até que a tabela seja reconhecida
    const { error } = await (supabase.from('web_vitals' as any) as any)
      .insert([body]);
      
    if (error) {
      if (import.meta.env.DEV) console.error('Error reporting vitals:', error);
    }
  } catch (e) {
    if (import.meta.env.DEV) console.warn('Vitals reporting bypassed', e);
  }
};

export const reportWebVitals = () => {
  onCLS(sendToAnalytics);
  onLCP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
  onINP(sendToAnalytics);
};
