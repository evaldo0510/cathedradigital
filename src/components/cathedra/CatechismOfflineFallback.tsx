import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { fetchCatechismParagraph } from '@/hooks/useCatechismParagraph';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';


interface CatechismOfflineFallbackProps {
  paragraph?: number;
  onRetry?: () => void;
}

const CatechismOfflineFallback: React.FC<CatechismOfflineFallbackProps> = ({ paragraph, onRetry }) => {
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [progress, setProgress] = useState(0);
  const isForcedOffline = localStorage.getItem('cathedra_offline_mode') === 'true';
  const isOnline = navigator.onLine;

  const MAX_RETRIES = 3;

  const handleDownload = async () => {
    if (!paragraph) return;
    setDownloading(true);
    setProgress(10);
    
    // Temporarily disable forced offline to allow the fetch
    const prevMode = localStorage.getItem('cathedra_offline_mode');
    localStorage.setItem('cathedra_offline_mode', 'false');

    const attemptFetch = async (attempt: number): Promise<void> => {
      setRetryAttempt(attempt);
      setProgress(10 + (attempt * 25));
      
      try {
        await fetchCatechismParagraph(paragraph);
        setProgress(100);
        localStorage.setItem('cathedra_offline_mode', prevMode || 'false');
        toast.success(`§${paragraph} baixado com sucesso!`);
        if (onRetry) onRetry();
      } catch (error) {
        if (attempt < MAX_RETRIES) {
          console.warn(`Download failed, retrying... (${attempt}/${MAX_RETRIES})`);
          // Wait before retrying (exponential backoff or simple delay)
          await new Promise(resolve => setTimeout(resolve, 2000));
          return attemptFetch(attempt + 1);
        } else {
          localStorage.setItem('cathedra_offline_mode', prevMode || 'false');
          throw error;
        }
      }
    };

    try {
      await attemptFetch(1);
    } catch (error) {
      toast.error('Erro ao baixar parágrafo após várias tentativas. Verifique sua conexão.');
    } finally {
      setDownloading(false);
      setRetryAttempt(0);
      setProgress(0);
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

      {downloading && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-primary">
            <span>{retryAttempt > 1 ? `Re-tentando (${retryAttempt}/${MAX_RETRIES})...` : 'Baixando conteúdo...'}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}


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
