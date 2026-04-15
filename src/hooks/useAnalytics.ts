import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppRoute } from '@/types';

export const useAnalytics = (userId: string | undefined) => {
  const location = useLocation();
  const lastTrackedPath = useRef('');

  useEffect(() => {
    if (lastTrackedPath.current === location.pathname || !userId) return;
    lastTrackedPath.current = location.pathname;
    
    const timer = setTimeout(() => {
      // Find a readable title for the current route
      let pageTitle = '';
      const path = location.pathname;
      
      const titleMap: Record<string, string> = {
        'biblia': 'Sagrada Escritura',
        'catecismo': 'Catecismo da Igreja',
        'hoje': 'Liturgia do Dia',
        'estudo': 'Logos IA',
        'jornada': 'Jornada Espiritual',
        'santos': 'Vida dos Santos',
        'oracao': 'Momento de Oração',
        'comunidade': 'Comunidade Cathedra'
      };

      for (const [key, title] of Object.entries(titleMap)) {
        if (path.includes(key)) {
          pageTitle = title;
          break;
        }
      }
      
      if (pageTitle) {
        supabase
          .from('user_history')
          .insert([{ 
            user_id: userId, 
            route: path, 
            title: pageTitle,
            visited_at: new Date().toISOString()
          }])
          .then(() => {}, () => {});
      }

      supabase
        .from('app_metrics')
        .insert([{ metric_type: 'visit', metadata: { path, user_id: userId } }])
        .then(() => {}, () => {});
    }, 3000);
    return () => clearTimeout(timer);
  }, [location.pathname, userId]);
};
