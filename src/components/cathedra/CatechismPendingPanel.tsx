import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Icons } from '../../constants';
import { useCatechismPending } from '@/contexts/CatechismPendingContext';
import { fetchCatechismParagraph } from '@/hooks/useCatechismParagraph';

interface Props {
  startPara: number;
  endPara: number;
  onJumpTo?: (p: number) => void;
}

const CatechismPendingPanel: React.FC<Props> = ({ startPara, endPara, onJumpTo }) => {
  const { pending, clearPending } = useCatechismPending();
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);

  const inRange = pending.filter(p => p >= startPara && p <= endPara);
  if (inRange.length === 0) return null;

  const verifyAll = async () => {
    if (isRunning) return;
    setIsRunning(true);
    const total = inRange.length;
    let recovered = 0;
    let stillMissing = 0;

    try {
      // Concorrência limitada para não saturar a Edge Function.
      const concurrency = 4;
      let idx = 0;
      const workers = Array.from({ length: Math.min(concurrency, total) }, async () => {
        while (idx < inRange.length) {
          const p = inRange[idx++];
          try {
            const result = await fetchCatechismParagraph(p);
            queryClient.setQueryData(['catechism-paragraph', p], result);
            clearPending(p);
            recovered += 1;
          } catch {
            // Continua marcado como pendente; mantém placeholder.
            stillMissing += 1;
          }
        }
      });
      await Promise.all(workers);

      if (recovered > 0 && stillMissing === 0) {
        toast.success(`${recovered} parágrafo${recovered > 1 ? 's' : ''} carregado${recovered > 1 ? 's' : ''} com sucesso.`);
      } else if (recovered > 0 && stillMissing > 0) {
        toast.success(`${recovered} recuperado${recovered > 1 ? 's' : ''}.`, {
          description: `${stillMissing} ainda não disponível${stillMissing > 1 ? 'eis' : ''} no banco oficial.`,
        });
      } else {
        toast.error(`Nenhum parágrafo disponível ainda. ${stillMissing} pendente${stillMissing > 1 ? 's' : ''}.`);
      }
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <aside
      role="status"
      aria-live="polite"
      data-testid="catechism-pending-panel"
      className="mb-spacing-md rounded-premium border border-dashed border-primary/15 bg-muted/20 p-spacing-md space-y-spacing-sm"
    >
      <div className="flex items-start justify-between gap-spacing-md flex-wrap">
        <div className="space-y-spacing-2xs">
          <div className="flex items-center gap-spacing-xs text-premium-xs font-display uppercase tracking-[0.2em] text-primary/60">
            <Icons.Catechism className="w-spacing-sm h-spacing-sm" />
            Parágrafos em preparação ({inRange.length})
          </div>
          <p className="text-premium-xs italic text-muted-foreground font-serif">
            Ainda não importados para o banco oficial em português nesta seção.
          </p>
        </div>
        <Button
          onClick={verifyAll}
          disabled={isRunning}
          variant="outline"
          size="sm"
          data-testid="catechism-verify-all"
        >
          {isRunning ? `Verificando ${inRange.length}…` : `Verificar todos (${inRange.length})`}
        </Button>
      </div>

      <ul className="flex flex-wrap gap-spacing-2xs" aria-label="Lista de parágrafos pendentes">
        {inRange.map(p => (
          <li key={p}>
            <button
              type="button"
              onClick={() => onJumpTo?.(p)}
              className="text-premium-xs font-display tracking-[0.1em] text-primary/60 hover:text-primary border border-primary/10 hover:border-primary/30 rounded-premium-full px-spacing-sm py-spacing-2xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label={`Ir para parágrafo ${p}`}
            >
              §{p}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default CatechismPendingPanel;
