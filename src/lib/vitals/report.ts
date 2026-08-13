import { onCLS, onFID, onLCP, onFCP, onTTFB, onINP, Metric } from 'web-vitals';
import { supabase } from '@/integrations/supabase/client';

const sendToAnalytics = async (metric: Metric) => {
  const body = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    path: window.location.pathname,
    timestamp: new Date().toISOString()
  };

  try {
    const { error } = await supabase
      .from('web_vitals')
      .insert([body]);
      
    if (error) {
      // Falha silenciosa em produção, log em dev
      if (import.meta.env.DEV) console.error('Error reporting vitals:', error);
    }
  } catch (e) {
    if (import.meta.env.DEV) console.warn('Vitals reporting bypassed', e);
  }
};

export const reportWebVitals = () => {
  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onLCP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
  onINP(sendToAnalytics);
};
