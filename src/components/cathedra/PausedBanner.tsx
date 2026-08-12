import React, { useState, useEffect } from 'react';
import { ShieldAlert, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export const PausedBanner = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { error } = await supabase.from('app_feature_flags').select('count', { count: 'exact', head: true });
        if (error && (error.message.includes('paused') || error.code === 'PGRST301')) {
          setIsPaused(true);
        }
      } catch (e) {
        // Silently fail, banner won't show
      }
    };
    checkStatus();
  }, []);

  if (!isPaused || !isVisible) return null;

  return (
    <div className="bg-amber-600 text-white py-2 px-4 flex items-center justify-between text-sm animate-in fade-in slide-in-from-top duration-300">
      <div className="flex items-center gap-3 mx-auto">
        <ShieldAlert className="h-4 w-4" />
        <h2 className="font-medium">
          A infraestrutura (banco de dados) está pausada. Algumas funcionalidades podem estar limitadas.
        </h2>
        <Button variant="link" className="text-white underline p-0 h-auto font-bold ml-2" asChild>
          <a href="/admin/site-health">Resolver Agora</a>
        </Button>
      </div>
      <button onClick={() => setIsVisible(false)} className="opacity-70 hover:opacity-100 transition-opacity">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
