import React from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/constants';
import { motion } from 'framer-motion';

interface SaintsOfflineFallbackProps {
  onRetry: () => void;
  isRetrying?: boolean;
  message?: string;
}

const SaintsOfflineFallback: React.FC<SaintsOfflineFallbackProps> = ({ 
  onRetry, 
  isRetrying = false,
  message = "O Santoral está temporariamente inacessível."
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-spacing-2xl bg-card rounded-premium border border-border/50 text-center space-y-spacing-lg"
    >
      <div className="w-spacing-4xl h-spacing-4xl rounded-premium-full bg-primary/5 flex items-center justify-center text-primary/40 mb-spacing-md">
        <Icons.WifiOff className="w-spacing-2xl h-spacing-2xl" />
      </div>
      
      <div className="space-y-spacing-xs">
        <h3 className="text-premium-lg font-display tracking-tight text-foreground">Conexão Interrompida</h3>
        <p className="text-premium-sm text-muted-foreground max-w-sm mx-auto">
          {message} Verifique sua internet ou tente novamente em alguns instantes.
        </p>
      </div>

      <Button 
        onClick={onRetry} 
        disabled={isRetrying}
        className="rounded-premium-full px-spacing-xl bg-primary hover:bg-primary/90 text-white shadow-premium-hover transition-all"
      >
        {isRetrying ? (
          <>
            <Icons.Loader2 className="mr-spacing-xs h-spacing-md w-spacing-md animate-spin" />
            Reconectando...
          </>
        ) : (
          <>
            <Icons.RefreshCw className="mr-spacing-xs h-spacing-md w-spacing-md" />
            Tentar Novamente
          </>
        )}
      </Button>
      
      <p className="text-premium-xs text-muted-foreground/60 font-medium italic">
        "Onde dois ou três estão reunidos em meu nome, eu estou ali no meio deles."
      </p>
    </motion.div>
  );
};

export default SaintsOfflineFallback;
