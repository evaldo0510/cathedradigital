import React, { useState, useEffect } from 'react';

const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSupabaseDown, setIsSupabaseDown] = useState(false);
  const [isForcedOffline, setIsForcedOffline] = useState(() => localStorage.getItem('cathedra_offline_mode') === 'true');

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);

    const handleSupabaseError = () => {
      setIsSupabaseDown(true);
      setTimeout(() => setIsSupabaseDown(false), 10000); // Reset after 10s
    };
    window.addEventListener('supabase-unreachable' as any, handleSupabaseError);

    const handleForcedOffline = (e: any) => {
      setIsForcedOffline(e.detail);
    };
    window.addEventListener('offline-mode-change' as any, handleForcedOffline);

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('supabase-unreachable' as any, handleSupabaseError);
      window.removeEventListener('offline-mode-change' as any, handleForcedOffline);
    };
  }, []);

  if (!isOffline && !isSupabaseDown && !isForcedOffline) return null;

  let title = 'Modo Offline';
  let sub = 'Usando cache local para textos essenciais';
  let color = 'bg-secondary';

  if (isForcedOffline) {
    title = 'Leitura Somente-Cache';
    sub = 'Rede desativada para soberania de dados';
    color = 'bg-primary';
  } else if (isSupabaseDown) {
    title = 'Banco de Dados Indisponível';
    sub = 'Tentando reconectar... Usando cache local.';
    color = 'bg-destructive';
  }

  return (
    <div className={`fixed bottom-md left-2xs/2 -translate-x-1/2 z-[200] px-md py-xs ${color} text-white rounded-full shadow-premium-hover flex flex-col items-center gap-2xs animate-in fade-in slide-in-from-bottom-md transition-colors`}>
      <div className="flex items-center gap-xs">
        <span className="w-xs h-xs rounded-full bg-white/70 animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-wider">
          {title}
        </span>
      </div>
      <span className="text-xs opacity-80 font-medium">
        {sub}
      </span>
    </div>
  );
};

export default OfflineIndicator;
