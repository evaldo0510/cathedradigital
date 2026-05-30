import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { fetchCatechismParagraph } from '@/hooks/useCatechismParagraph';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CatechismOfflineFallbackProps {
  paragraph?: number;
  onRetry?: () => void;
}

const CatechismOfflineFallback: React.FC<CatechismOfflineFallbackProps> = ({ paragraph, onRetry }) => {
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [progress, setProgress] = useState(0);
  const isCancelled = useRef(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);


  useEffect(() => {
    // Check if there was a pending download for this paragraph
    if (!paragraph) return;
    
    const pendingData = localStorage.getItem(`cathedra_download_pending_${paragraph}`);
    if (pendingData) {
      const { attempt, progress: lastProgress } = JSON.parse(pendingData);
      // If found, auto-resume
      handleDownload(attempt, lastProgress);
    }
  }, [paragraph]);

  const saveDownloadState = (attempt: number, p: number) => {
    if (!paragraph) return;
    localStorage.setItem(`cathedra_download_pending_${paragraph}`, JSON.stringify({
      attempt,
      progress: p,
      timestamp: Date.now()
    }));
  };

  const clearDownloadState = () => {
    if (!paragraph) return;
    localStorage.removeItem(`cathedra_download_pending_${paragraph}`);
  };


  const isForcedOffline = localStorage.getItem('cathedra_offline_mode') === 'true';
  const isOnline = navigator.onLine;

  const MAX_RETRIES = 3;

  const handleDownload = async (resumeAttempt = 1, resumeProgress = 10) => {
    if (!paragraph) return;
    setDownloading(true);
    setProgress(resumeProgress);
    isCancelled.current = false;
    
    const prevMode = localStorage.getItem('cathedra_offline_mode');
    localStorage.setItem('cathedra_offline_mode', 'false');

    const attemptFetch = async (attempt: number): Promise<void> => {
      if (isCancelled.current) {
        localStorage.setItem('cathedra_offline_mode', prevMode || 'false');
        return;
      }

      setRetryAttempt(attempt);
      const currentProgress = 10 + (attempt * 25);
      setProgress(currentProgress);
      saveDownloadState(attempt, currentProgress);
      
      try {
        await fetchCatechismParagraph(paragraph);
        if (isCancelled.current) return;
        
        setProgress(100);
        localStorage.setItem('cathedra_offline_mode', prevMode || 'false');
        clearDownloadState();
        toast.success(`§${paragraph} baixado com sucesso!`);
        if (onRetry) onRetry();
      } catch (error) {
        if (isCancelled.current) {
          localStorage.setItem('cathedra_offline_mode', prevMode || 'false');
          return;
        }

        if (attempt < MAX_RETRIES) {
          console.warn(`Download failed, retrying... (${attempt}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          return attemptFetch(attempt + 1);
        } else {
          localStorage.setItem('cathedra_offline_mode', prevMode || 'false');
          clearDownloadState();
          throw error;
        }
      }
    };

    try {
      await attemptFetch(resumeAttempt);
    } catch (error) {
      if (!isCancelled.current) {
        toast.error('Erro ao baixar parágrafo após várias tentativas. Verifique sua conexão.');
      }
    } finally {
      setDownloading(false);
      setRetryAttempt(0);
      setProgress(0);
    }
  };


  const handleCancel = () => {
    setShowCancelConfirm(true);
  };

  const confirmCancel = () => {
    isCancelled.current = true;
    setDownloading(false);
    clearDownloadState();
    toast.info('Download cancelado pelo usuário.');
    setShowCancelConfirm(false);
  };







  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="reader-text bg-muted/30 border border-border rounded-[2rem] p-spacing-xl text-center space-y-spacing-lg my-spacing-xl"
    >
      <div className="mx-auto w-spacing-3xl h-spacing-3xl rounded-premium bg-primary/5 flex items-center justify-center border border-primary/10">
        <Icons.WifiOff className="w-spacing-xl h-spacing-xl text-primary/40" />
      </div>

      {downloading && (
        <div className="space-y-spacing-sm animate-in fade-in slide-in-from-top-spacing-xs">
          <div className="flex justify-between text-premium-xs font-black uppercase tracking-widest text-primary">
            <span>{retryAttempt > 1 ? `Re-tentando (${retryAttempt}/${MAX_RETRIES})...` : 'Baixando conteúdo...'}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-spacing-2xs" />
        </div>
      )}


      <div className="space-y-spacing-xs">
        <h3 className="text-premium-xl font-serif font-bold text-foreground">
          {paragraph ? `Parágrafo §${paragraph} Offline` : 'Catecismo Offline'}
        </h3>
        <p className="text-premium-sm text-muted-foreground leading-relaxed max-w-spacing-sm mx-auto">
          {isForcedOffline 
            ? 'Você está no modo somente-cache. Este parágrafo ainda não foi baixado para o seu dispositivo.'
            : 'Parece que você está sem conexão. Este parágrafo não está disponível no cache local.'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-spacing-sm">
        {paragraph && isOnline && (
          <Button 
            onClick={downloading ? handleCancel : () => handleDownload()}
            variant={downloading ? "destructive" : "default"}
            className="rounded-premium-full h-spacing-xl px-spacing-lg font-bold w-full sm:w-auto transition-all"
          >
            {downloading ? (
              <>
                <Icons.X className="w-spacing-md h-spacing-md mr-spacing-xs" /> Cancelar
              </>
            ) : (
              <>
                <Icons.Download className="w-spacing-md h-spacing-md mr-spacing-xs" /> Baixar Agora
              </>
            )}
          </Button>
        )}

        {onRetry && !downloading && (
          <Button 
            onClick={onRetry}
            variant="secondary"
            className="rounded-premium-full h-spacing-xl px-spacing-lg font-bold w-full sm:w-auto"
          >
            <Icons.RotateCcw className="w-spacing-md h-spacing-md mr-spacing-xs" /> Tentar Carregar
          </Button>
        )}
        <Button 
          onClick={() => navigate('/cache-manager')}
          variant="outline"
          className="rounded-premium-full h-spacing-xl px-spacing-lg font-bold w-full sm:w-auto"
        >
          <Icons.Library className="w-spacing-md h-spacing-md mr-spacing-xs" /> Gerenciar Cache
        </Button>
      </div>

      <div className="pt-spacing-md border-t border-border/40">
        <p className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground">
          Dica: Vá em "Gerenciar Cache" para baixar seções completas para uso offline.
        </p>
      </div>
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent className="rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Confirmar Cancelamento</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente cancelar o download do parágrafo? O progresso será perdido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-premium-full font-bold">Voltar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmCancel}
              className="rounded-premium-full font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar e Cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default CatechismOfflineFallback;
