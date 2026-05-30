import { Button } from '@/components/ui/button';
import React from 'react';
import { Icons } from '@/constants';
import { useOfflineMode } from '@/hooks/useOfflineMode';
import { motion, AnimatePresence } from 'framer-motion';

const OfflineModeToggle: React.FC = () => {
  const { isOfflineMode, toggle } = useOfflineMode();

  return (
    <Button
      onClick={toggle}
      className={`fixed bottom-spacing-4xl right-spacing-3xl lg:bottom-spacing-lg lg:right-spacing-4xl z-50 p-spacing-sm rounded-full border shadow-premium hover:shadow-premium-hover transition-all group flex items-center gap-spacing-xs ${
        isOfflineMode 
          ? 'bg-primary border-primary text-primary-foreground' 
          : 'bg-card border-border text-muted-foreground'
      }`}
      title={isOfflineMode ? 'Desativar modo somente-cache' : 'Ativar modo leitura somente-cache'}
    >
      {isOfflineMode ? (
        <Icons.WifiOff className="w-spacing-md h-spacing-md group-hover:scale-110 transition-transform" />
      ) : (
        <Icons.Wifi className="w-spacing-md h-spacing-md group-hover:text-primary group-hover:scale-110 transition-all" />
      )}
      <AnimatePresence>
        {isOfflineMode && (
          <motion.span
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="text-xs font-black uppercase tracking-widest overflow-hidden whitespace-nowrap"
          >
            Offline
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
};

export default OfflineModeToggle;
