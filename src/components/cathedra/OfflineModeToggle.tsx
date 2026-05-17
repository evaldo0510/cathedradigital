import React from 'react';
import { Icons } from '@/constants';
import { useOfflineMode } from '@/hooks/useOfflineMode';
import { motion, AnimatePresence } from 'framer-motion';

const OfflineModeToggle: React.FC = () => {
  const { isOfflineMode, toggle } = useOfflineMode();

  return (
    <button
      onClick={toggle}
      className={`fixed bottom-24 right-20 lg:bottom-6 lg:right-24 z-50 p-3 rounded-full border shadow-lg hover:shadow-xl transition-all group flex items-center gap-2 ${
        isOfflineMode 
          ? 'bg-primary border-primary text-primary-foreground' 
          : 'bg-card border-border text-muted-foreground'
      }`}
      title={isOfflineMode ? 'Desativar modo somente-cache' : 'Ativar modo leitura somente-cache'}
    >
      {isOfflineMode ? (
        <Icons.WifiOff className="w-5 h-5 group-hover:scale-110 transition-transform" />
      ) : (
        <Icons.Wifi className="w-5 h-5 group-hover:text-primary group-hover:scale-110 transition-all" />
      )}
      <AnimatePresence>
        {isOfflineMode && (
          <motion.span
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="text-[10px] font-black uppercase tracking-widest overflow-hidden whitespace-nowrap"
          >
            Offline
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
};

export default OfflineModeToggle;
