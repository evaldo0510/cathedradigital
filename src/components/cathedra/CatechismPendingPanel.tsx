import React, { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Icons } from '../../constants';
import { useCatechismPending } from '@/contexts/CatechismPendingContext';
import { fetchCatechismParagraph, CatechismFetchError } from '@/hooks/useCatechismParagraph';

interface Props {
  startPara: number;
  endPara: number;
  onJumpTo?: (p: number) => void;
}

const reasonLabel = (code?: string) => {
  switch (code) {
    case 'not_found': return 'não encontrado no banco oficial';
    case 'network': return 'falha de rede';
    case 'unauthorized': return 'sessão expirada';
    case 'forbidden': return 'sem permissão';
    default: return 'erro desconhecido';
  }
};

const triggerDownload = (filename: string, mime: string, content: string) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const CatechismPendingPanel: React.FC<Props> = ({ startPara, endPara, onJumpTo }) => {
  const { pending, clearPending } = useCatechismPending();
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const cancelRef = useRef(false);

  const inRange = pending.filter(p => p >= startPara && p <= endPara);
  if (inRange.length === 0) return null;

  const verifyAll = async () => {
    if (isRunning) return;
    cancelRef.current = false;
    setIsRunning(true);
    const total = inRange.length;
    setProgress({ done: 0, total });
    let recovered = 0;
    let stillMissing = 0;
    let cancelled = 0;

    try {
      const concurrency = 4;
      let idx = 0;
      const workers = Array.from({ length: Math.min(concurrency, total) }, async () => {
        while (idx < inRange.length) {
          if (cancelRef.current) {
            cancelled += (inRange.length - idx);
            idx = inRange.length;
            break;
          }
          const p = inRange[idx++];
          const attempt = idx;
          try {
            const result = await fetchCatechismParagraph(p);
            queryClient.setQueryData(['catechism-paragraph', p], result);
            clearPending(p);
            recovered += 1;
          } catch (err) {
            stillMissing += 1;
            const code = err instanceof CatechismFetchError ? err.code : 'unknown';
            toast.error(`§${p} — ${reasonLabel(code)}`, {
              description: `Tentativa ${attempt}/${total}${(err as any)?.status ? ` · HTTP ${(err as any).status}` : ''}`,
            });
          } finally {
            setProgress(prev => ({ done: prev.done + 1, total }));
          }
        }
      });
      await Promise.all(workers);

      if (cancelRef.current) {
        toast.message('Verificação cancelada.', {
          description: `${recovered} recuperado(s) · ${stillMissing} com erro · ${cancelled} não processado(s).`,
        });
      } else if (recovered > 0 && stillMissing === 0) {
        toast.success(`${recovered} parágrafo${recovered > 1 ? 's' : ''} carregado${recovered > 1 ? 's' : ''} com sucesso.`);
      } else if (recovered > 0 && stillMissing > 0) {
        toast.success(`${recovered} recuperado${recovered > 1 ? 's' : ''}.`, {
          description: `${stillMissing} ainda não disponível${stillMissing > 1 ? 'eis' : ''} no banco oficial.`,
        });
      } else {
        toast.error(`Nenhum parágrafo disponível ainda. ${stillMissing} pendente${stillMissing > 1 ? 's' : ''}.`);
      }
    } finally {
      cancelRef.current = false;
      setIsRunning(false);
    }
  };

  const handleCancel = () => {
    if (!isRunning) return;
    cancelRef.current = true;
  };

  const exportJSON = () => {
    const payload = {
      generated_at: new Date().toISOString(),
      section: { start: startPara, end: endPara },
      count: inRange.length,
      paragraphs: inRange,
    };
    triggerDownload(
      `catechism-pending-${startPara}-${endPara}.json`,
      'application/json',
      JSON.stringify(payload, null, 2),
    );
  };

  const exportCSV = () => {
    const rows = ['paragraph,section_start,section_end,status'];
    inRange.forEach(p => rows.push(`${p},${startPara},${endPara},pending`));
    triggerDownload(
      `catechism-pending-${startPara}-${endPara}.csv`,
      'text/csv;charset=utf-8',
      rows.join('\n'),
    );
  };

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

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
        <div className="flex items-center gap-spacing-2xs flex-wrap">
          <Button
            onClick={exportCSV}
            disabled={isRunning}
            variant="ghost"
            size="sm"
            data-testid="catechism-export-csv"
            title="Exportar lista em CSV"
          >
            CSV
          </Button>
          <Button
            onClick={exportJSON}
            disabled={isRunning}
            variant="ghost"
            size="sm"
            data-testid="catechism-export-json"
            title="Exportar lista em JSON"
          >
            JSON
          </Button>
          {isRunning ? (
            <Button
              onClick={handleCancel}
              variant="outline"
              size="sm"
              data-testid="catechism-verify-cancel"
            >
              Cancelar
            </Button>
          ) : (
            <Button
              onClick={verifyAll}
              variant="outline"
              size="sm"
              data-testid="catechism-verify-all"
            >
              Verificar todos ({inRange.length})
            </Button>
          )}
        </div>
      </div>

      {isRunning && (
        <div className="space-y-spacing-2xs" data-testid="catechism-verify-progress">
          <div className="flex items-center justify-between text-premium-xs font-display tracking-[0.1em] uppercase text-primary/60">
            <span>Verificando…</span>
            <span>{progress.done}/{progress.total} · {pct}%</span>
          </div>
          <Progress value={pct} />
        </div>
      )}

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
