import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { fetchCatechismParagraph } from '@/hooks/useCatechismParagraph';
import { toast } from 'sonner';

interface CatechismOfflineFallbackProps {
  paragraph?: number;
  onRetry?: () => void;
}

const CatechismOfflineFallback: React.FC<CatechismOfflineFallbackProps> = ({ paragraph, onRetry }) => {
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const isForcedOffline = localStorage.getItem('cathedra_offline_mode') === 'true';
  const isOnline = navigator.onLine;

  const handleDownload = async () => {
    if (!paragraph) return;
    setDownloading(true);
    try {
      // Temporarily disable forced offline to allow the fetch
      const prevMode = localStorage.getItem('cathedra_offline_mode');
      localStorage.setItem('cathedra_offline_mode', 'false');
      
      await fetchCatechismParagraph(paragraph);
      
      localStorage.setItem('cathedra_offline_mode', prevMode || 'false');
      toast.success(`§${paragraph} baixado com sucesso!`);
      if (onRetry) onRetry();
    } catch (error) {
      toast.error('Erro ao baixar parágrafo. Verifique sua conexão.');
    } finally {
      setDownloading(false);
    }
  };


  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="reader-text bg-muted/30 border border-border rounded-[2rem] p-8 text-center space-y-6 my-10"
    >
      <div className="mx-auto w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
        <Icons.WifiOff className="w-8 h-8 text-primary/40" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-serif font-bold text-foreground">
          {paragraph ? `Parágrafo §${paragraph} Offline` : 'Catecismo Offline'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
          {isForcedOffline 
            ? 'Você está no modo somente-cache. Este parágrafo ainda não foi baixado para o seu dispositivo.'
            : 'Parece que você está sem conexão. Este parágrafo não está disponível no cache local.'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {paragraph && isOnline && (
          <Button 
            onClick={handleDownload}
            disabled={downloading}
            variant="default"
            className="rounded-xl h-10 px-6 font-bold w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {downloading ? (
              <Icons.Loader className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Icons.Download className="w-4 h-4 mr-2" />
            )}
            Baixar Agora
          </Button>
        )}
        {onRetry && !downloading && (
          <Button 
            onClick={onRetry}
            variant="secondary"
            className="rounded-xl h-10 px-6 font-bold w-full sm:w-auto"
          >
            <Icons.RotateCcw className="w-4 h-4 mr-2" /> Tentar Carregar
          </Button>
        )}
        <Button 
          onClick={() => navigate('/cache-manager')}
          variant="outline"
          className="rounded-xl h-10 px-6 font-bold w-full sm:w-auto"
        >
          <Icons.Library className="w-4 h-4 mr-2" /> Gerenciar Cache
        </Button>
      </div>

      <div className="pt-4 border-t border-border/40">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Dica: Vá em "Gerenciar Cache" para baixar seções completas para uso offline.
        </p>
      </div>
    </motion.div>
  );
};

export default CatechismOfflineFallback;
