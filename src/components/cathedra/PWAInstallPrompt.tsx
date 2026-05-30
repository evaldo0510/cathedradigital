import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user has already dismissed it or if it's already installed
      const dismissed = localStorage.getItem('pwa-prompt-dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', async () => {
      setDeferredPrompt(null);
      setShowPrompt(false);
      console.log('PWA installed successfully');
      
      // Track PWA install in Supabase if needed
      try {
        await supabase.from('app_metrics').insert({
          metric_type: 'pwa_install',
          metadata: { timestamp: new Date().toISOString() }
        });
      } catch (err) {
        console.error('Error tracking PWA install:', err);
      }
      
      toast.success('Aplicativo instalado com sucesso! Verifique sua tela de início.');
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install');
    } else {
      console.log('User dismissed the PWA install');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-3xl left-md right-md md:left-auto md:right-xl md:bottom-xl md:w-80 bg-background border border-primary/20 p-md rounded-premium shadow-premium-hover z-50 animate-in fade-in slide-in-from-bottom-md duration-300">
      <Button 
        onClick={handleDismiss}
        className="absolute top-xs right-xs text-muted-foreground hover:text-foreground"
      >
        <X className="h-md w-md" />
      </Button>
      <div className="flex items-start gap-md">
        <div className="h-2xl w-2xl rounded-premium bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Download className="h-lg w-lg text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-primary leading-none mb-2xs">Instalar Cathedra</h3>
          <p className="text-xs text-muted-foreground mb-sm">
            Acesse a Bíblia e suas orações com um toque, mesmo offline.
          </p>
          <div className="flex gap-xs">
            <Button size="sm" onClick={handleInstallClick} className="h-xl text-xs px-md">
              Instalar agora
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss} className="h-xl text-xs">
              Agora não
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
