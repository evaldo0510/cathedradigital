import React from 'react';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';

interface Props {
  message?: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

/**
 * Bloco de erro acessível para falhas de fetch em /santos.
 * - `role="alert"` + `aria-live="assertive"` → leitor de tela anuncia imediatamente.
 * - Botão "Tentar novamente" reexecuta a query mantendo o contexto.
 */
export const SaintsFetchError: React.FC<Props> = ({
  message,
  onRetry,
  isRetrying = false,
}) => {
  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      data-testid="saints-fetch-error"
      className="text-center py-spacing-3xl bg-destructive/5 rounded-[2.5rem] border border-dashed border-destructive/40 space-y-spacing-md"
    >
      <Icons.AlertCircle
        className="w-spacing-2xl h-spacing-2xl text-destructive mx-auto"
        aria-hidden="true"
      />
      <div className="space-y-spacing-xs px-spacing-md">
        <p className="text-premium-lg font-serif italic text-foreground">
          Não foi possível carregar os santos do dia.
        </p>
        <p className="text-premium-xs text-muted-foreground max-w-md mx-auto">
          {message || 'Verifique sua conexão e tente novamente em instantes.'}
        </p>
      </div>
      <Button
        onClick={onRetry}
        disabled={isRetrying}
        aria-busy={isRetrying}
        variant="secondary"
        className="min-h-11"
      >
        <Icons.RefreshCw
          className={`w-spacing-md h-spacing-md ${isRetrying ? 'animate-spin' : ''}`}
          aria-hidden="true"
        />
        {isRetrying ? 'Tentando…' : 'Tentar novamente'}
      </Button>
    </div>
  );
};

export default SaintsFetchError;
