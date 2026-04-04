import React from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Download, X, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const InstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || isInstalled || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 80 }}
        className="fixed bottom-20 lg:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-[180]"
      >
        <div className="bg-background/95 backdrop-blur-2xl border border-primary/20 rounded-2xl p-4 shadow-2xl shadow-black/30 flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div className="flex-1 space-y-2">
            <h4 className="text-sm font-black uppercase tracking-wider text-foreground">Instalar App</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Adicione o Cathedra à sua tela inicial para acesso rápido e experiência completa.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={install}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20"
              >
                <Download className="w-3.5 h-3.5" />
                Instalar
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InstallBanner;
