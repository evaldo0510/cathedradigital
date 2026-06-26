import React, { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Icons } from '../../constants';
import { useCatechismPending } from '@/contexts/CatechismPendingContext';
import { fetchCatechismParagraph, CatechismFetchError } from '@/hooks/useCatechismParagraph';

interface Props {
  startPara: number;
  endPara: number;
  onJumpTo?: (p: number) => void;
}

type RunStatus = 'pending' | 'recovered' | 'error' | 'cancelled';

interface ParaState {
  paragraph: number;
  status: RunStatus;
  attempts: number;
  lastAttemptAt?: string;
  errorCode?: string;
  errorMessage?: string;
  httpStatus?: number;
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

const isTransient = (code?: string) => code === 'network' || code === 'unknown';

const sleep = (ms: number, signal: { cancelled: boolean }) =>
  new Promise<void>(resolve => {
    const start = Date.now();
    const tick = () => {
      if (signal.cancelled || Date.now() - start >= ms) return resolve();
      setTimeout(tick, Math.min(120, ms - (Date.now() - start)));
    };
    tick();
  });

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

const csvEscape = (v: unknown) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const MAX_BACKOFF_RETRIES = 3;
const BASE_BACKOFF_MS = 600;
const CONCURRENCY_KEY = 'cathedra.catechism.verifyConcurrency';

const CatechismPendingPanel: React.FC<Props> = ({ startPara, endPara, onJumpTo }) => {
  const { pending, clearPending } = useCatechismPending();
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<Record<number, ParaState>>({});
  const [concurrency, setConcurrency] = useState<number>(() => {
    if (typeof window === 'undefined') return 4;
    const raw = Number(window.localStorage.getItem(CONCURRENCY_KEY));
    return Number.isFinite(raw) && raw >= 1 && raw <= 8 ? raw : 4;
  });
  const cancelRef = useRef({ cancelled: false });
  const sessionKey = `cathedra.catechism.verifyRun.${startPara}-${endPara}`;

  // Persiste configuração de concorrência.
  useEffect(() => {
    try { window.localStorage.setItem(CONCURRENCY_KEY, String(concurrency)); } catch {}
  }, [concurrency]);

  // Restaura progresso e resultados parciais ao montar/trocar de seção.
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(sessionKey);
      if (!raw) { setProgress({ done: 0, total: 0 }); setResults({}); return; }
      const saved = JSON.parse(raw);
      setProgress(saved.progress ?? { done: 0, total: 0 });
      setResults(saved.results ?? {});
    } catch {}
  }, [sessionKey]);

  // Persiste progresso/resultados a cada mudança.
  useEffect(() => {
    try {
      window.sessionStorage.setItem(sessionKey, JSON.stringify({ progress, results }));
    } catch {}
  }, [sessionKey, progress, results]);

  const inRange = pending.filter(p => p >= startPara && p <= endPara);
  if (inRange.length === 0 && Object.keys(results).length === 0) return null;

  const recordResult = (p: number, patch: Partial<ParaState>) => {
    setResults(prev => ({
      ...prev,
      [p]: { paragraph: p, status: 'pending', attempts: 0, ...prev[p], ...patch },
    }));
  };

  const fetchWithBackoff = async (p: number): Promise<{ ok: boolean; err?: any; attempts: number }> => {
    let attempts = 0;
    let lastErr: any = null;
    while (attempts <= MAX_BACKOFF_RETRIES) {
      if (cancelRef.current.cancelled) return { ok: false, err: lastErr ?? new Error('cancelled'), attempts };
      attempts += 1;
      try {
        const result = await fetchCatechismParagraph(p);
        queryClient.setQueryData(['catechism-paragraph', p], result);
        clearPending(p);
        recordResult(p, {
          status: 'recovered',
          attempts,
          lastAttemptAt: new Date().toISOString(),
          errorCode: undefined,
          errorMessage: undefined,
          httpStatus: undefined,
        });
        return { ok: true, attempts };
      } catch (err: any) {
        lastErr = err;
        const code = err instanceof CatechismFetchError ? err.code : 'unknown';
        recordResult(p, {
          status: 'error',
          attempts,
          lastAttemptAt: new Date().toISOString(),
          errorCode: code,
          errorMessage: err?.message,
          httpStatus: err?.status,
        });
        if (!isTransient(code) || attempts > MAX_BACKOFF_RETRIES) {
          return { ok: false, err, attempts };
        }
        const backoff = BASE_BACKOFF_MS * Math.pow(2, attempts - 1);
        await sleep(backoff, cancelRef.current);
      }
    }
    return { ok: false, err: lastErr, attempts };
  };

  const verifyAll = async () => {
    if (isRunning || inRange.length === 0) return;
    cancelRef.current = { cancelled: false };
    setIsRunning(true);
    const total = inRange.length;
    setProgress({ done: 0, total });
    setResults({}); // limpa run anterior desta seção
    let recovered = 0;
    let stillMissing = 0;
    let cancelled = 0;

    try {
      const workerCount = Math.max(1, Math.min(concurrency, total));
      let idx = 0;
      const workers = Array.from({ length: workerCount }, async () => {
        while (idx < inRange.length) {
          if (cancelRef.current.cancelled) {
            const remaining = inRange.length - idx;
            cancelled += remaining;
            for (let i = idx; i < inRange.length; i += 1) {
              recordResult(inRange[i], { status: 'cancelled' });
            }
            idx = inRange.length;
            break;
          }
          const p = inRange[idx++];
          const attemptIdx = idx;
          const res = await fetchWithBackoff(p);
          if (res.ok === true) {
            recovered += 1;
          } else {
            stillMissing += 1;
            const errAny: any = res.err;
            const code = errAny instanceof CatechismFetchError ? errAny.code : 'unknown';
            toast.error(`§${p} — ${reasonLabel(code)}`, {
              description: `Tentativa ${attemptIdx}/${total} · ${res.attempts} tentativa(s) na rede${errAny?.status ? ` · HTTP ${errAny.status}` : ''}`,
            });
          }
          setProgress(prev => ({ done: prev.done + 1, total }));
        }
      });
      await Promise.all(workers);

      if (cancelRef.current.cancelled) {
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
      cancelRef.current.cancelled = false;
      setIsRunning(false);
    }
  };

  const handleCancel = () => {
    if (!isRunning) return;
    cancelRef.current.cancelled = true;
  };

  const buildExportRows = (): ParaState[] => {
    const map = new Map<number, ParaState>();
    inRange.forEach(p => map.set(p, results[p] ?? { paragraph: p, status: 'pending', attempts: 0 }));
    Object.values(results).forEach(r => { if (!map.has(r.paragraph)) map.set(r.paragraph, r); });
    return Array.from(map.values()).sort((a, b) => a.paragraph - b.paragraph);
  };

  const exportJSON = () => {
    const payload = {
      generated_at: new Date().toISOString(),
      section: { start: startPara, end: endPara },
      concurrency,
      progress,
      paragraphs: buildExportRows(),
    };
    triggerDownload(
      `catechism-pending-${startPara}-${endPara}.json`,
      'application/json',
      JSON.stringify(payload, null, 2),
    );
  };

  const exportCSV = () => {
    const rows = ['paragraph,section_start,section_end,status,attempts,last_attempt_at,error_code,http_status,error_message'];
    buildExportRows().forEach(r => {
      rows.push([
        r.paragraph, startPara, endPara, r.status, r.attempts,
        r.lastAttemptAt ?? '', r.errorCode ?? '', r.httpStatus ?? '', r.errorMessage ?? '',
      ].map(csvEscape).join(','));
    });
    triggerDownload(
      `catechism-pending-${startPara}-${endPara}.csv`,
      'text/csv;charset=utf-8',
      rows.join('\n'),
    );
  };

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  const hasExportable = inRange.length > 0 || Object.keys(results).length > 0;

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
          <Button onClick={exportCSV} disabled={!hasExportable} variant="ghost" size="sm" data-testid="catechism-export-csv" title="Exportar lista em CSV">
            CSV
          </Button>
          <Button onClick={exportJSON} disabled={!hasExportable} variant="ghost" size="sm" data-testid="catechism-export-json" title="Exportar lista em JSON">
            JSON
          </Button>
          {isRunning ? (
            <Button onClick={handleCancel} variant="outline" size="sm" data-testid="catechism-verify-cancel">
              Cancelar
            </Button>
          ) : (
            <Button onClick={verifyAll} variant="outline" size="sm" data-testid="catechism-verify-all" disabled={inRange.length === 0}>
              Verificar todos ({inRange.length})
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-spacing-sm flex-wrap" data-testid="catechism-concurrency-control">
        <label htmlFor="catechism-concurrency" className="text-premium-xs font-display tracking-[0.1em] uppercase text-primary/60 whitespace-nowrap">
          Concorrência
        </label>
        <div className="flex-1 min-w-[140px] max-w-[240px]">
          <Slider
            id="catechism-concurrency"
            min={1}
            max={8}
            step={1}
            value={[concurrency]}
            onValueChange={(v) => setConcurrency(v[0] ?? 4)}
            disabled={isRunning}
            aria-label="Requisições simultâneas"
          />
        </div>
        <span className="text-premium-xs font-display text-primary/70 tabular-nums w-spacing-xl text-right">
          {concurrency}x
        </span>
      </div>

      {(isRunning || progress.done > 0) && (
        <div className="space-y-spacing-2xs" data-testid="catechism-verify-progress">
          <div className="flex items-center justify-between text-premium-xs font-display tracking-[0.1em] uppercase text-primary/60">
            <span>{isRunning ? 'Verificando…' : 'Última execução'}</span>
            <span>{progress.done}/{progress.total} · {pct}%</span>
          </div>
          <Progress value={pct} />
        </div>
      )}

      <ul className="flex flex-wrap gap-spacing-2xs" aria-label="Lista de parágrafos pendentes">
        {inRange.map(p => {
          const r = results[p];
          const tone =
            r?.status === 'recovered' ? 'text-emerald-600 border-emerald-500/30 hover:border-emerald-500/50' :
            r?.status === 'error' ? 'text-destructive border-destructive/30 hover:border-destructive/50' :
            r?.status === 'cancelled' ? 'text-amber-600 border-amber-500/30 hover:border-amber-500/50' :
            'text-primary/60 hover:text-primary border-primary/10 hover:border-primary/30';
          return (
            <li key={p}>
              <button
                type="button"
                onClick={() => onJumpTo?.(p)}
                className={`text-premium-xs font-display tracking-[0.1em] border rounded-premium-full px-spacing-sm py-spacing-2xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${tone}`}
                aria-label={`Ir para parágrafo ${p}${r ? ` (${r.status})` : ''}`}
                title={r?.errorMessage ?? r?.status ?? 'pendente'}
              >
                §{p}{r?.attempts ? ` ·${r.attempts}` : ''}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default CatechismPendingPanel;
