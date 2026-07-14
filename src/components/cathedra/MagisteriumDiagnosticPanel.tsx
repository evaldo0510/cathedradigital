import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  MagisteriumDiagEvent,
  clearMagisteriumDiag,
  enableMagisteriumDebug,
  getMagisteriumDiagBuffer,
  getPersistedMagisteriumErrors,
  isMagisteriumDebugOn,
} from '@/lib/magisteriumDiagnostics';

const ERROR_STEPS = ['fetch_404', 'fetch_error', 'fetch_thin', 'cache_thin', 'final_error'] as const;
const OK_STEPS = ['cache_hit', 'fetch_ok'] as const;

const buildDiagReport = (
  buffer: MagisteriumDiagEvent[],
  persisted: MagisteriumDiagEvent[],
) => {
  const lastError = [...buffer].reverse().find((ev) => (ERROR_STEPS as readonly string[]).includes(ev.step))
    ?? [...persisted].reverse().find((ev) => (ERROR_STEPS as readonly string[]).includes(ev.step))
    ?? null;

  const summary = buffer.reduce(
    (acc, ev) => {
      if ((OK_STEPS as readonly string[]).includes(ev.step)) acc.ok += 1;
      else if ((ERROR_STEPS as readonly string[]).includes(ev.step)) acc.errors += 1;
      else acc.other += 1;
      return acc;
    },
    { ok: 0, errors: 0, other: 0 },
  );

  return {
    generatedAt: new Date().toISOString(),
    route: typeof window !== 'undefined' ? window.location.pathname + window.location.search : null,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    counts: { buffer: buffer.length, persisted: persisted.length, ...summary },
    lastError,
    timeline: buffer,
    persistedErrors: persisted,
  };
};


const SEVERITY: Record<string, 'error' | 'warn' | 'ok'> = {
  cache_hit: 'ok',
  fetch_ok: 'ok',
  cache_thin: 'warn',
  fetch_thin: 'warn',
  fetch_404: 'error',
  fetch_error: 'error',
  final_error: 'error',
};

const exportDiagReport = (
  buffer: MagisteriumDiagEvent[],
  persisted: MagisteriumDiagEvent[],
) => {
  const report = buildDiagReport(buffer, persisted);
  try {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `magisterium-diagnostic-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  } catch {/* silent */}
};

const copyDiagReport = async (
  buffer: MagisteriumDiagEvent[],
  persisted: MagisteriumDiagEvent[],
) => {
  const report = buildDiagReport(buffer, persisted);
  const text = JSON.stringify(report, null, 2);
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    toast.success('Relatório de diagnóstico copiado');
  } catch {
    toast.error('Falha ao copiar relatório');
  }
};


const MagisteriumDiagnosticPanel: React.FC = () => {
  const location = useLocation();
  const [enabled, setEnabled] = useState<boolean>(() => isMagisteriumDebugOn());
  const [open, setOpen] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    window.addEventListener('magisterium-diagnostic', handler);
    window.addEventListener('magisterium-diagnostic-cleared', handler);
    return () => {
      window.removeEventListener('magisterium-diagnostic', handler);
      window.removeEventListener('magisterium-diagnostic-cleared', handler);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('debug') === '1' && !enabled) {
      enableMagisteriumDebug(true);
      setEnabled(true);
    }
  }, [location.search, enabled]);

  const buffer = useMemo<MagisteriumDiagEvent[]>(() => getMagisteriumDiagBuffer(), [tick]);
  const persisted = useMemo<MagisteriumDiagEvent[]>(() => getPersistedMagisteriumErrors(), [tick]);

  if (!enabled) return null;

  const thinCount = buffer.filter((e) => e.step === 'cache_thin' || e.step === 'fetch_thin').length;

  return (
    <div
      data-testid="magisterium-diagnostic-panel"
      className="fixed bottom-4 right-4 z-[200] w-[360px] max-w-[calc(100vw-2rem)] rounded-premium border border-primary/20 bg-background/95 backdrop-blur-md shadow-premium text-foreground"
    >
      <div className="flex items-center justify-between gap-spacing-xs px-spacing-md py-spacing-xs border-b border-border/60">
        <div className="flex items-center gap-spacing-xs">
          <span className="text-premium-xs font-black uppercase tracking-widest text-primary">
            Diagnóstico do Magistério
          </span>
          <Badge variant="secondary" className="text-[9px]">DEV</Badge>
          {thinCount > 0 && (
            <Badge variant="destructive" className="text-[9px]" data-testid="magisterium-thin-badge">
              {thinCount} thin
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-spacing-2xs">
          <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>{open ? '−' : '+'}</Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { enableMagisteriumDebug(false); setEnabled(false); }}
            aria-label="Desativar diagnóstico"
          >
            ×
          </Button>
        </div>
      </div>

      {open && (
        <div className="p-spacing-md space-y-spacing-sm text-premium-xs">
          <div className="grid grid-cols-2 gap-spacing-xs">
            <div className="space-y-spacing-3xs">
              <div className="text-muted-foreground uppercase tracking-widest text-[9px]">Rota</div>
              <div className="font-mono truncate">{location.pathname + location.search}</div>
            </div>
            <div className="space-y-spacing-3xs">
              <div className="text-muted-foreground uppercase tracking-widest text-[9px]">Eventos</div>
              <div className="font-mono">{buffer.length} / persist: {persisted.length}</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-muted-foreground uppercase tracking-widest text-[9px]">Linha do tempo</div>
            <div className="flex items-center gap-spacing-2xs">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[10px]"
                onClick={() => exportDiagReport(buffer, persisted)}
                data-testid="magisterium-diagnostic-export"
              >
                Exportar JSON
              </Button>
              <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={clearMagisteriumDiag}>
                Limpar
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[240px] rounded-premium border border-border/40 bg-muted/20">
            <ul className="p-spacing-xs space-y-spacing-2xs">
              {buffer.length === 0 && (
                <li className="text-muted-foreground italic text-premium-xs px-spacing-xs py-spacing-sm">
                  Nenhum evento ainda. Abra um documento do Magistério.
                </li>
              )}
              {buffer.map((ev, i) => {
                const sev = SEVERITY[ev.step] ?? 'warn';
                return (
                  <li
                    key={`${ev.ts}-${i}`}
                    className={cn(
                      'flex items-start gap-spacing-xs font-mono text-[10px] leading-relaxed border-l-2 pl-spacing-xs',
                      sev === 'error' && 'border-destructive text-destructive',
                      sev === 'warn' && 'border-amber-500 text-amber-700 dark:text-amber-400',
                      sev === 'ok' && 'border-primary/40 text-foreground/70',
                    )}
                  >
                    <span className="opacity-60 shrink-0">{new Date(ev.ts).toLocaleTimeString()}</span>
                    <span className="font-bold shrink-0 truncate max-w-[80px]">{ev.docId ?? '—'}</span>
                    <span className="shrink-0">{ev.step}</span>
                    {ev.contentLength !== undefined && <span className="shrink-0">· {ev.contentLength}c</span>}
                    {ev.status !== undefined && <span className="shrink-0">· {String(ev.status)}</span>}
                    {ev.message && <span className="truncate">· {ev.message}</span>}
                  </li>
                );
              })}
            </ul>
          </ScrollArea>

          {persisted.length > 0 && (
            <details className="text-[10px]">
              <summary className="cursor-pointer text-muted-foreground uppercase tracking-widest text-[9px]">
                Últimos erros persistidos ({persisted.length})
              </summary>
              <ScrollArea className="h-[140px] mt-spacing-xs">
                <ul className="space-y-spacing-2xs font-mono">
                  {persisted.map((ev, i) => (
                    <li key={i} className="text-destructive/90">
                      {new Date(ev.ts).toLocaleString()} · {ev.docId ?? '—'} · {ev.step}
                      {ev.contentLength !== undefined ? ` · ${ev.contentLength}c` : ''}
                      {ev.message ? ` · ${ev.message}` : ''}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </details>
          )}
        </div>
      )}
    </div>
  );
};

export default MagisteriumDiagnosticPanel;
