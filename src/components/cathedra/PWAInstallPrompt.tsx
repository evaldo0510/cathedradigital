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
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-80 bg-background border border-primary/20 p-4 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <button 
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Download className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-primary leading-none mb-1">Instalar Cathedra</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Acesse a Bíblia e suas orações com um toque, mesmo offline.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleInstallClick} className="h-8 text-xs px-4">
              Instalar agora
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss} className="h-8 text-xs">
              Agora não
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
