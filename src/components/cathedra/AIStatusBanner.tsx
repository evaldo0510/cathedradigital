import React, { useEffect, useState } from 'react';
import { AlertTriangle, X, ExternalLink, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type AIStatusEventDetail = {
  type: 'credits_exhausted' | 'rate_limited';
  message?: string;
};

const STORAGE_KEY = 'ai-status-banner-dismissed-until';

const AIStatusBanner: React.FC = () => {
  const [status, setStatus] = useState<AIStatusEventDetail | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<AIStatusEventDetail>).detail;
      if (!detail) return;

      // Check if user dismissed it recently (within the last 5 min for rate limit, 30 min for credits)
      const dismissedUntil = Number(localStorage.getItem(STORAGE_KEY) || 0);
      if (Date.now() < dismissedUntil && detail.type === 'rate_limited') return;

      setStatus(detail);
    };

    window.addEventListener('ai-status-error', handler);
    return () => window.removeEventListener('ai-status-error', handler);
  }, []);

  const dismiss = () => {
    // Hide for 5 min on rate limit, 30 min on credits
    const ttl = status?.type === 'credits_exhausted' ? 30 * 60_000 : 5 * 60_000;
    localStorage.setItem(STORAGE_KEY, String(Date.now() + ttl));
    setStatus(null);
  };

  if (!status) return null;

  const isCredits = status.type === 'credits_exhausted';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="fixed top-0 inset-x-0 z-[100] px-3 pt-3 pointer-events-none"
        role="alert"
        aria-live="polite"
      >
        <div
          className={`pointer-events-auto mx-auto max-w-3xl rounded-xl border shadow-lg backdrop-blur-md ${
            isCredits
              ? 'border-destructive/40 bg-destructive/10 text-destructive-foreground'
              : 'border-amber-500/40 bg-amber-500/10 text-foreground'
          }`}
        >
          <div className="flex items-start gap-3 p-3 sm:p-4">
            <div className={`shrink-0 mt-0.5 ${isCredits ? 'text-destructive' : 'text-amber-500'}`}>
              {isCredits ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {isCredits
                  ? 'Créditos de IA esgotados'
                  : 'Limite de requisições atingido'}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {isCredits
                  ? 'A IA Logos está temporariamente indisponível. O administrador precisa adicionar créditos no workspace para reativar o serviço.'
                  : 'Muitas requisições à IA em um curto período. Aguarde um instante e tente novamente.'}
              </p>

              {isCredits && (
                <a
                  href="https://lovable.dev/settings/workspace/usage"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-primary hover:underline"
                >
                  Abrir Usage do workspace
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <button
              onClick={dismiss}
              className="shrink-0 p-1 rounded-md hover:bg-foreground/10 transition-colors"
              aria-label="Fechar aviso"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIStatusBanner;
