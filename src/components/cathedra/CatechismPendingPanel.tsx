import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Icons } from '../../constants';
import { useCatechismPending } from '@/contexts/CatechismPendingContext';
import { fetchCatechismParagraph, CatechismFetchError } from '@/hooks/useCatechismParagraph';

interface Props {
  startPara: number;
  endPara: number;
  onJumpTo?: (p: number) => void;
}

type RunStatus = 'pending' | 'recovered' | 'error' | 'cancelled' | 'backoff';

interface ParaState {
  paragraph: number;
  status: RunStatus;
  attempts: number;
  lastAttemptAt?: string;
  nextAttemptAt?: string;
  responseTimeMs?: number;
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
      setTimeout(tick, Math.min(250, ms - (Date.now() - start)));
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

const CONCURRENCY_KEY = 'cathedra.catechism.verifyConcurrency';
const MAX_RETRIES_KEY = 'cathedra.catechism.verifyMaxRetries';
const BASE_BACKOFF_KEY = 'cathedra.catechism.verifyBaseBackoffMs';

const readNum = (key: string, fallback: number, min: number, max: number) => {
  if (typeof window === 'undefined') return fallback;
  const raw = Number(window.localStorage.getItem(key));
  return Number.isFinite(raw) && raw >= min && raw <= max ? raw : fallback;
};

const CatechismPendingPanel: React.FC<Props> = ({ startPara, endPara, onJumpTo }) => {
  const { pending, clearPending } = useCatechismPending();
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<Record<number, ParaState>>({});
  const [runStatus, setRunStatus] = useState<'idle' | 'running' | 'cancelled' | 'completed'>('idle');
  const [paused, setPaused] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [exportFilter, setExportFilter] = useState<'all' | 'pending' | 'backoff' | 'error'>('all');
  const [now, setNow] = useState(() => Date.now());

  const [concurrency, setConcurrency] = useState<number>(() => readNum(CONCURRENCY_KEY, 4, 1, 8));
  const [maxRetries, setMaxRetries] = useState<number>(() => readNum(MAX_RETRIES_KEY, 3, 0, 6));
  const [baseBackoffMs, setBaseBackoffMs] = useState<number>(() => readNum(BASE_BACKOFF_KEY, 600, 100, 5000));

  const cancelRef = useRef({ cancelled: false });
  const pausedRef = useRef(false);
  const autoResumedRef = useRef(false);
  const sessionKey = `cathedra.catechism.verifyRun.${startPara}-${endPara}`;

  // Persistência das configurações.
  useEffect(() => { try { localStorage.setItem(CONCURRENCY_KEY, String(concurrency)); } catch {} }, [concurrency]);
  useEffect(() => { try { localStorage.setItem(MAX_RETRIES_KEY, String(maxRetries)); } catch {} }, [maxRetries]);
  useEffect(() => { try { localStorage.setItem(BASE_BACKOFF_KEY, String(baseBackoffMs)); } catch {} }, [baseBackoffMs]);

  // Restaura estado salvo da seção.
  useEffect(() => {
    autoResumedRef.current = false;
    try {
      const raw = sessionStorage.getItem(sessionKey);
      if (!raw) {
        setProgress({ done: 0, total: 0 }); setResults({}); setRunStatus('idle');
        setPaused(false); pausedRef.current = false;
        return;
      }
      const saved = JSON.parse(raw);
      setProgress(saved.progress ?? { done: 0, total: 0 });
      setResults(saved.results ?? {});
      setRunStatus(saved.runStatus ?? 'idle');
      const wasPaused = Boolean(saved.paused);
      setPaused(wasPaused);
      pausedRef.current = wasPaused;
    } catch {}
  }, [sessionKey]);

  // Persiste estado a cada mudança.
  useEffect(() => {
    try {
      sessionStorage.setItem(sessionKey, JSON.stringify({ progress, results, runStatus, paused }));
    } catch {}
  }, [sessionKey, progress, results, runStatus, paused]);

  // Tick global apenas quando há countdown ativo.
  useEffect(() => {
    const hasCountdown = Object.values(results).some(r => r.status === 'backoff' && r.nextAttemptAt);
    if (!hasCountdown && !isRunning) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [results, isRunning]);

  const inRange = pending.filter(p => p >= startPara && p <= endPara);

  const recordResult = (p: number, patch: Partial<ParaState>) => {
    setResults(prev => ({
      ...prev,
      [p]: { paragraph: p, status: 'pending', attempts: 0, ...prev[p], ...patch },
    }));
  };

  const fetchWithBackoff = async (
    p: number,
    cfg: { maxRetries: number; baseBackoffMs: number },
  ): Promise<{ ok: boolean; err?: any; attempts: number }> => {
    let attempts = 0;
    let lastErr: any = null;
    while (attempts <= cfg.maxRetries) {
      if (cancelRef.current.cancelled) return { ok: false, err: lastErr ?? new Error('cancelled'), attempts };
      attempts += 1;
      const t0 = performance.now();
      try {
        const result = await fetchCatechismParagraph(p);
        const elapsed = Math.round(performance.now() - t0);
        queryClient.setQueryData(['catechism-paragraph', p], result);
        clearPending(p);
        recordResult(p, {
          status: 'recovered',
          attempts,
          lastAttemptAt: new Date().toISOString(),
          nextAttemptAt: undefined,
          responseTimeMs: elapsed,
          errorCode: undefined,
          errorMessage: undefined,
          httpStatus: undefined,
        });
        return { ok: true, attempts };
      } catch (err: any) {
        const elapsed = Math.round(performance.now() - t0);
        lastErr = err;
        const code = err instanceof CatechismFetchError ? err.code : 'unknown';
        const willRetry = isTransient(code) && attempts <= cfg.maxRetries;
        const backoffMs = willRetry ? cfg.baseBackoffMs * Math.pow(2, attempts - 1) : 0;
        recordResult(p, {
          status: willRetry ? 'backoff' : 'error',
          attempts,
          lastAttemptAt: new Date().toISOString(),
          nextAttemptAt: willRetry ? new Date(Date.now() + backoffMs).toISOString() : undefined,
          responseTimeMs: elapsed,
          errorCode: code,
          errorMessage: err?.message,
          httpStatus: err?.status,
        });
        if (!willRetry) return { ok: false, err, attempts };
        await sleep(backoffMs, cancelRef.current);
        if (cancelRef.current.cancelled) return { ok: false, err, attempts };
      }
    }
    return { ok: false, err: lastErr, attempts };
  };

  const runWorkers = async (queue: number[], cfg: { maxRetries: number; baseBackoffMs: number; concurrency: number }) => {
    const total = queue.length;
    let recovered = 0;
    let stillMissing = 0;
    let cancelled = 0;
    let idx = 0;
    const workerCount = Math.max(1, Math.min(cfg.concurrency, total));
    const workers = Array.from({ length: workerCount }, async () => {
      while (idx < queue.length) {
        if (cancelRef.current.cancelled) {
          const remaining = queue.length - idx;
          cancelled += remaining;
          for (let i = idx; i < queue.length; i += 1) {
            recordResult(queue[i], { status: 'cancelled', nextAttemptAt: undefined });
          }
          idx = queue.length;
          break;
        }
        const p = queue[idx++];
        const attemptIdx = idx;
        const res = await fetchWithBackoff(p, { maxRetries: cfg.maxRetries, baseBackoffMs: cfg.baseBackoffMs });
        if (res.ok === true) {
          recovered += 1;
        } else if (!cancelRef.current.cancelled) {
          stillMissing += 1;
          const errAny: any = res.err;
          const code = errAny instanceof CatechismFetchError ? errAny.code : 'unknown';
          toast.error(`§${p} — ${reasonLabel(code)}`, {
            description: `Item ${attemptIdx}/${total} · ${res.attempts} tentativa(s)${errAny?.status ? ` · HTTP ${errAny.status}` : ''}`,
          });
        }
        setProgress(prev => ({ done: prev.done + 1, total: prev.total || total }));
      }
    });
    await Promise.all(workers);
    return { recovered, stillMissing, cancelled };
  };

  const startRun = async (queue: number[], opts: { resume: boolean }) => {
    if (isRunning || queue.length === 0) return;
    cancelRef.current = { cancelled: false };
    setIsRunning(true);
    setRunStatus('running');
    if (!opts.resume) {
      setResults({});
      setProgress({ done: 0, total: queue.length });
    } else {
      setProgress(prev => ({ done: prev.done, total: prev.total || (prev.done + queue.length) }));
    }
    try {
      const summary = await runWorkers(queue, { maxRetries, baseBackoffMs, concurrency });
      if (cancelRef.current.cancelled) {
        setRunStatus('cancelled');
        toast.message('Verificação cancelada.', {
          description: `${summary.recovered} recuperado(s) · ${summary.stillMissing} com erro · ${summary.cancelled} não processado(s).`,
        });
      } else {
        setRunStatus('completed');
        if (summary.recovered > 0 && summary.stillMissing === 0) {
          toast.success(`${summary.recovered} parágrafo${summary.recovered > 1 ? 's' : ''} carregado${summary.recovered > 1 ? 's' : ''} com sucesso.`);
        } else if (summary.recovered > 0) {
          toast.success(`${summary.recovered} recuperado(s).`, { description: `${summary.stillMissing} ainda não disponível(eis) no banco oficial.` });
        } else {
          toast.error(`Nenhum parágrafo disponível ainda. ${summary.stillMissing} pendente(s).`);
        }
      }
    } finally {
      cancelRef.current.cancelled = false;
      setIsRunning(false);
    }
  };

  const verifyAll = () => startRun(inRange, { resume: false });

  const handleCancel = () => {
    if (!isRunning) return;
    cancelRef.current.cancelled = true;
    setRunStatus('cancelled');
  };

  // Retomada automática após refresh: apenas se runStatus === 'running' (não cancelado/concluído).
  useEffect(() => {
    if (autoResumedRef.current) return;
    if (runStatus !== 'running') return;
    if (isRunning) return;
    if (inRange.length === 0) return;
    autoResumedRef.current = true;
    const processed = new Set(
      Object.values(results)
        .filter(r => r.status === 'recovered' || r.status === 'error')
        .map(r => r.paragraph),
    );
    const remaining = inRange.filter(p => !processed.has(p));
    if (remaining.length === 0) {
      setRunStatus('completed');
      return;
    }
    toast.message('Retomando verificação…', { description: `${remaining.length} parágrafo(s) restantes.` });
    startRun(remaining, { resume: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runStatus, inRange.length]);

  if (inRange.length === 0 && Object.keys(results).length === 0) return null;

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
      run_status: runStatus,
      config: { concurrency, max_retries: maxRetries, base_backoff_ms: baseBackoffMs },
      progress,
      paragraphs: buildExportRows(),
    };
    triggerDownload(`catechism-pending-${startPara}-${endPara}.json`, 'application/json', JSON.stringify(payload, null, 2));
  };

  const exportCSV = () => {
    const rows = ['paragraph,section_start,section_end,status,attempts,last_attempt_at,next_attempt_at,response_time_ms,error_code,http_status,error_message'];
    buildExportRows().forEach(r => {
      rows.push([
        r.paragraph, startPara, endPara, r.status, r.attempts,
        r.lastAttemptAt ?? '', r.nextAttemptAt ?? '', r.responseTimeMs ?? '',
        r.errorCode ?? '', r.httpStatus ?? '', r.errorMessage ?? '',
      ].map(csvEscape).join(','));
    });
    triggerDownload(`catechism-pending-${startPara}-${endPara}.csv`, 'text/csv;charset=utf-8', rows.join('\n'));
  };

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  const hasExportable = inRange.length > 0 || Object.keys(results).length > 0;

  const secondsUntil = (iso?: string) => {
    if (!iso) return 0;
    const diff = new Date(iso).getTime() - now;
    return diff > 0 ? Math.ceil(diff / 1000) : 0;
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
        <div className="flex items-center gap-spacing-2xs flex-wrap">
          <Button onClick={exportCSV} disabled={!hasExportable} variant="ghost" size="sm" data-testid="catechism-export-csv">CSV</Button>
          <Button onClick={exportJSON} disabled={!hasExportable} variant="ghost" size="sm" data-testid="catechism-export-json">JSON</Button>
          {isRunning ? (
            <Button onClick={handleCancel} variant="outline" size="sm" data-testid="catechism-verify-cancel">Cancelar</Button>
          ) : (
            <Button onClick={verifyAll} variant="outline" size="sm" data-testid="catechism-verify-all" disabled={inRange.length === 0}>
              Verificar todos ({inRange.length})
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-spacing-sm sm:grid-cols-3" data-testid="catechism-verify-config">
        <div className="flex items-center gap-spacing-xs">
          <label htmlFor="cat-concurrency" className="text-premium-xs font-display tracking-[0.1em] uppercase text-primary/60 whitespace-nowrap">
            Concorrência
          </label>
          <Slider
            id="cat-concurrency"
            min={1} max={8} step={1}
            value={[concurrency]}
            onValueChange={(v) => setConcurrency(v[0] ?? 4)}
            disabled={isRunning}
            className="flex-1"
            aria-label="Requisições simultâneas"
          />
          <span className="text-premium-xs font-display text-primary/70 tabular-nums w-spacing-xl text-right">{concurrency}x</span>
        </div>
        <div className="flex items-center gap-spacing-xs">
          <label htmlFor="cat-max-retries" className="text-premium-xs font-display tracking-[0.1em] uppercase text-primary/60 whitespace-nowrap">
            Máx. tentativas
          </label>
          <Input
            id="cat-max-retries"
            type="number" min={0} max={6} step={1}
            value={maxRetries}
            onChange={(e) => setMaxRetries(Math.max(0, Math.min(6, Number(e.target.value) || 0)))}
            disabled={isRunning}
            className="h-8 w-spacing-3xl text-premium-xs"
          />
        </div>
        <div className="flex items-center gap-spacing-xs">
          <label htmlFor="cat-backoff" className="text-premium-xs font-display tracking-[0.1em] uppercase text-primary/60 whitespace-nowrap">
            Backoff inicial (ms)
          </label>
          <Input
            id="cat-backoff"
            type="number" min={100} max={5000} step={100}
            value={baseBackoffMs}
            onChange={(e) => setBaseBackoffMs(Math.max(100, Math.min(5000, Number(e.target.value) || 600)))}
            disabled={isRunning}
            className="h-8 w-spacing-4xl text-premium-xs"
          />
        </div>
      </div>

      {(isRunning || progress.done > 0) && (
        <div className="space-y-spacing-2xs" data-testid="catechism-verify-progress">
          <div className="flex items-center justify-between text-premium-xs font-display tracking-[0.1em] uppercase text-primary/60">
            <span>
              {isRunning ? 'Verificando…' : runStatus === 'cancelled' ? 'Cancelada' : runStatus === 'completed' ? 'Concluída' : 'Última execução'}
            </span>
            <span>{progress.done}/{progress.total} · {pct}%</span>
          </div>
          <Progress value={pct} />
        </div>
      )}

      <ul className="flex flex-wrap gap-spacing-2xs" aria-label="Lista de parágrafos pendentes">
        {inRange.map(p => {
          const r = results[p];
          const tone =
            r?.status === 'recovered' ? 'text-emerald-600 border-emerald-500/30' :
            r?.status === 'error' ? 'text-destructive border-destructive/30' :
            r?.status === 'cancelled' ? 'text-amber-600 border-amber-500/30' :
            r?.status === 'backoff' ? 'text-sky-600 border-sky-500/30 animate-pulse' :
            'text-primary/60 border-primary/10 hover:border-primary/30';
          const countdown = r?.status === 'backoff' ? secondsUntil(r.nextAttemptAt) : 0;
          const label = countdown > 0
            ? `§${p} · ${countdown}s`
            : `§${p}${r?.attempts ? ` ·${r.attempts}` : ''}${r?.responseTimeMs ? ` · ${r.responseTimeMs}ms` : ''}`;
          const title = r?.status === 'backoff'
            ? `Próxima tentativa em ${countdown}s`
            : r?.errorMessage ?? r?.status ?? 'pendente';
          return (
            <li key={p}>
              <button
                type="button"
                onClick={() => onJumpTo?.(p)}
                className={`text-premium-xs font-display tracking-[0.1em] border rounded-premium-full px-spacing-sm py-spacing-2xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${tone}`}
                aria-label={`Ir para parágrafo ${p}${r ? ` (${r.status})` : ''}`}
                title={title}
              >
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default CatechismPendingPanel;
