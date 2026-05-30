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
    <div className="flex flex-col items-center justify-center min-h-[80dvh] p-spacing-lg text-center space-y-spacing-xl animate-in fade-in duration-700">
      <SEOHead title="Você está Offline" description="O Cathedra Digital continua disponível em modo offline." path="/offline" />
      
      <div className="relative">
        <div className="w-spacing-4xl h-spacing-4xl rounded-premium bg-primary/5 flex items-center justify-center border border-primary/10">
          <Icons.WifiOff className="w-spacing-2xl h-spacing-2xl text-primary/40" />
        </div>
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-spacing-xs -right-spacing-xs w-spacing-xl h-spacing-xl rounded-premium-full bg-secondary flex items-center justify-center border-4 border-background"
        >
          <Icons.AlertTriangle className="w-spacing-md h-spacing-md text-secondary-foreground" />
        </motion.div>
      </div>

      <div className="max-w-spacing-md space-y-spacing-md">
        <h1 className="text-premium-3xl font-serif font-bold text-foreground">
          {isForcedOffline ? 'Soberania de Dados Ativa' : 'Conexão Interrompida'}
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          {isForcedOffline 
            ? 'Você ativou o modo somente-cache. O acesso à rede foi desabilitado para garantir total privacidade e foco.'
            : 'Parece que você está sem conexão com a internet. Não se preocupe, a Palavra e o Magistério permanecem com você.'}
        </p>
        
        {stats && stats.total > 0 && (
          <div className="flex flex-col items-center gap-spacing-xs pt-spacing-xs animate-in fade-in slide-in-from-top-spacing-2xs duration-1000">
            <div className="flex items-center gap-spacing-xs text-premium-xs font-black uppercase tracking-widest text-primary bg-primary/5 px-spacing-md py-spacing-xs rounded-premium border border-primary/10">
              <Icons.Library className="w-spacing-sm h-spacing-sm" />
              {stats.total} textos salvos offline
            </div>
            {stats.lastSync && (
              <span className="text-premium-xs text-muted-foreground font-medium italic">
                Sincronizado {formatDistanceToNow(parseInt(stats.lastSync), { addSuffix: true, locale: ptBR })}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-spacing-md w-full max-w-spacing-sm">
        <Button 
          variant="outline" 
          className="rounded-premium-full h-spacing-2xl font-bold border-primary/20 hover:bg-primary/5"
          onClick={() => navigate('/bible')}
        >
          <Icons.Bible className="w-spacing-md h-spacing-md mr-spacing-xs" /> Sagrada Escritura
        </Button>
        <Button 
          variant="outline" 
          className="rounded-premium-full h-spacing-2xl font-bold border-primary/20 hover:bg-primary/5"
          onClick={() => navigate('/catechism')}
        >
          <Icons.ShieldCheck className="w-spacing-md h-spacing-md mr-spacing-xs" /> Catecismo
        </Button>
        <Button 
          variant="outline" 
          className="rounded-premium-full h-spacing-2xl font-bold border-primary/20 hover:bg-primary/5"
          onClick={() => navigate('/hoje')}
        >
          <Icons.Sun className="w-spacing-md h-spacing-md mr-spacing-xs" /> Liturgia do Dia
        </Button>
        <Button 
          variant="secondary" 
          className="rounded-premium-full h-spacing-2xl font-bold"
          onClick={() => window.location.reload()}
        >
          <Icons.RotateCcw className="w-spacing-md h-spacing-md mr-spacing-xs" /> Tentar Reconectar
        </Button>
      </div>

      <div className="pt-spacing-xl">
        <Button 
          onClick={() => navigate('/cache-manager')}
          className="text-premium-xs font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors flex items-center gap-spacing-xs"
        >
          <Icons.Settings className="w-spacing-sm h-spacing-sm" /> Gerenciar Cache Local
        </Button>
      </div>
    </div>
  );
};

export default OfflinePage;
