import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, RefreshCw, ExternalLink, Sparkles } from 'lucide-react';
import type { AIFallbackReason } from '@/services/aiService';

interface Props {
  reason?: AIFallbackReason;
  /** Static fallback content to display while AI is unavailable */
  staticContent?: React.ReactNode;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

const REASON_CONFIG: Record<AIFallbackReason, {
  icon: React.ElementType;
  title: string;
  description: string;
  showUsageLink: boolean;
  retryable: boolean;
}> = {
  credits_exhausted: {
    icon: AlertCircle,
    title: 'IA temporariamente indisponível',
    description: 'Os créditos de IA do workspace acabaram. Mostramos abaixo uma versão estática enquanto o serviço é reativado.',
    showUsageLink: true,
    retryable: true,
  },
  rate_limited: {
    icon: Clock,
    title: 'Muitas requisições',
    description: 'Aguarde alguns segundos antes de tentar novamente. Mostramos abaixo uma versão estática.',
    showUsageLink: false,
    retryable: true,
  },
  daily_limit: {
    icon: Sparkles,
    title: 'Limite diário atingido',
    description: 'Você usou suas mensagens gratuitas de hoje. Assine o PRO para mensagens ilimitadas.',
    showUsageLink: false,
    retryable: false,
  },
  auth: {
    icon: AlertCircle,
    title: 'Sessão expirada',
    description: 'Faça login novamente para continuar usando a IA.',
    showUsageLink: false,
    retryable: false,
  },
  network: {
    icon: AlertCircle,
    title: 'Falha de conexão',
    description: 'Não foi possível alcançar a IA. Verifique sua conexão e tente de novo.',
    showUsageLink: false,
    retryable: true,
  },
};

const AIFallbackCard: React.FC<Props> = ({
  reason = 'network',
  staticContent,
  onRetry,
  isRetrying = false,
  className = '',
}) => {
  const config = REASON_CONFIG[reason];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-border/60 bg-muted/30 p-4 sm:p-5 space-y-4 ${className}`}
      role="status"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 p-2 rounded-lg bg-secondary/20 text-secondary">
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground">{config.title}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
        </div>
      </div>

      {staticContent && (
        <div className="pt-3 border-t border-border/50 text-sm text-foreground/90 leading-relaxed">
          {staticContent}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {config.retryable && onRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Tentando...' : 'Tentar novamente'}
          </button>
        )}

        {config.showUsageLink && (
          <a
            href="https://lovable.dev/settings/workspace/usage"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-foreground/5 transition-colors"
          >
            Abrir Usage
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </motion.div>
  );
};

export default AIFallbackCard;
