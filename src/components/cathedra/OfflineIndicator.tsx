import React, { useState, useEffect } from 'react';

const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSupabaseDown, setIsSupabaseDown] = useState(false);

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

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('supabase-unreachable' as any, handleSupabaseError);
    };
  }, []);

  if (!isOffline && !isSupabaseDown) return null;

  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] px-5 py-2.5 ${isSupabaseDown ? 'bg-destructive' : 'bg-secondary'} text-white rounded-2xl shadow-xl flex flex-col items-center gap-1 animate-in fade-in slide-in-from-bottom-4 transition-colors`}>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-white/70 animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-wider">
          {isSupabaseDown ? 'Banco de Dados Indisponível' : 'Modo Offline'}
        </span>
      </div>
      <span className="text-[10px] opacity-80 font-medium">
        {isSupabaseDown ? 'Tentando reconectar... Usando cache local.' : 'Usando cache local para textos essenciais'}
      </span>
    </div>
  );
};

export default OfflineIndicator;
