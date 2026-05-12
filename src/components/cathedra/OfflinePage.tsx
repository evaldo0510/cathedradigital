import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import { getCacheStats } from '@/lib/offlineCache';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const OfflinePage: React.FC = () => {
  const navigate = useNavigate();
  const isForcedOffline = localStorage.getItem('cathedra_offline_mode') === 'true';
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    getCacheStats().then(setStats);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80dvh] p-6 text-center space-y-8 animate-in fade-in duration-700">
      <SEOHead title="Você está Offline" description="O Cathedra Digital continua disponível em modo offline." path="/offline" />
      
      <div className="relative">
        <div className="w-32 h-32 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
          <Icons.WifiOff className="w-12 h-12 text-primary/40" />
        </div>
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-secondary flex items-center justify-center border-4 border-background"
        >
          <Icons.AlertTriangle className="w-4 h-4 text-secondary-foreground" />
        </motion.div>
      </div>

      <div className="max-w-md space-y-4">
        <h1 className="text-3xl font-serif font-bold text-foreground">
          {isForcedOffline ? 'Soberania de Dados Ativa' : 'Conexão Interrompida'}
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          {isForcedOffline 
            ? 'Você ativou o modo somente-cache. O acesso à rede foi desabilitado para garantir total privacidade e foco.'
            : 'Parece que você está sem conexão com a internet. Não se preocupe, a Palavra e o Magistério permanecem com você.'}
        </p>
        
        {stats && stats.total > 0 && (
          <div className="flex flex-col items-center gap-2 pt-2 animate-in fade-in slide-in-from-top-1 duration-1000">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
              <Icons.Library className="w-3 h-3" />
              {stats.total} textos salvos offline
            </div>
            {stats.lastSync && (
              <span className="text-[9px] text-muted-foreground font-medium italic">
                Sincronizado {formatDistanceToNow(parseInt(stats.lastSync), { addSuffix: true, locale: ptBR })}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-sm">
        <Button 
          variant="outline" 
          className="rounded-2xl h-14 font-bold border-primary/20 hover:bg-primary/5"
          onClick={() => navigate('/bible')}
        >
          <Icons.Bible className="w-4 h-4 mr-2" /> Sagrada Escritura
        </Button>
        <Button 
          variant="outline" 
          className="rounded-2xl h-14 font-bold border-primary/20 hover:bg-primary/5"
          onClick={() => navigate('/catechism')}
        >
          <Icons.ShieldCheck className="w-4 h-4 mr-2" /> Catecismo
        </Button>
        <Button 
          variant="outline" 
          className="rounded-2xl h-14 font-bold border-primary/20 hover:bg-primary/5"
          onClick={() => navigate('/hoje')}
        >
          <Icons.Sun className="w-4 h-4 mr-2" /> Liturgia do Dia
        </Button>
        <Button 
          variant="secondary" 
          className="rounded-2xl h-14 font-bold"
          onClick={() => window.location.reload()}
        >
          <Icons.RotateCcw className="w-4 h-4 mr-2" /> Tentar Reconectar
        </Button>
      </div>

      <div className="pt-8">
        <button 
          onClick={() => navigate('/cache-manager')}
          className="text-xs font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors flex items-center gap-2"
        >
          <Icons.Settings className="w-3 h-3" /> Gerenciar Cache Local
        </button>
      </div>
    </div>
  );
};

export default OfflinePage;
