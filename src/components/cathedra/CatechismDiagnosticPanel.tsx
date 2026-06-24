import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  CatechismDiagEvent,
  clearCatechismDiag,
  enableCatechismDebug,
  getCatechismDiagBuffer,
  getPersistedCatechismErrors,
  isCatechismDebugOn,
} from '@/lib/catechismDiagnostics';

/**
 * Painel de diagnóstico do Catecismo.
 * Visível quando:
 *  - localStorage `cathedra_catechism_debug` = '1', OU
 *  - URL contém ?debug=1
 *
 * Mostra: rota atual, parágrafo, status da requisição e mensagens de erro
 * (em tempo real + os últimos 50 erros persistidos).
 */
const SEVERITY: Record<string, 'error' | 'warn' | 'ok'> = {
  cache_hit: 'ok',
  official_query: 'ok',
  official_hit: 'ok',
  local_hit: 'ok',
  edge_invoke: 'ok',
  edge_hit: 'ok',
  fallback_cached: 'warn',
  edge_not_found: 'warn',
  official_error: 'error',
  edge_error: 'error',
  unauthorized: 'error',
  forbidden: 'error',
  final_error: 'error',
};

const exportDiagReport = (
  buffer: CatechismDiagEvent[],
  persisted: CatechismDiagEvent[],
) => {
  const lastError =
    [...buffer, ...persisted].find((ev) =>
      ['final_error', 'edge_error', 'official_error', 'unauthorized', 'forbidden', 'edge_not_found'].includes(ev.step),
    ) ?? null;

  const report = {
    generatedAt: new Date().toISOString(),
    route: typeof window !== 'undefined' ? window.location.pathname + window.location.search : null,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    counts: { buffer: buffer.length, persisted: persisted.length },
    lastError,
    timeline: buffer,
    persistedErrors: persisted,
  };

  try {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `catechism-diagnostic-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  } catch {
    /* ignore — best effort */
  }
};

  cache_hit: 'ok',
  official_query: 'ok',
  official_hit: 'ok',
  local_hit: 'ok',
  edge_invoke: 'ok',
  edge_hit: 'ok',
  fallback_cached: 'warn',
  edge_not_found: 'warn',
  official_error: 'error',
  edge_error: 'error',
  unauthorized: 'error',
  forbidden: 'error',
  final_error: 'error',
};

const CatechismDiagnosticPanel: React.FC = () => {
  const location = useLocation();
  const [enabled, setEnabled] = useState<boolean>(() => isCatechismDebugOn());
  const [open, setOpen] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    window.addEventListener('catechism-diagnostic', handler);
    window.addEventListener('catechism-diagnostic-cleared', handler);
    return () => {
      window.removeEventListener('catechism-diagnostic', handler);
      window.removeEventListener('catechism-diagnostic-cleared', handler);
    };
  }, []);

  // Permite ativar via ?debug=1
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('debug') === '1' && !enabled) {
      enableCatechismDebug(true);
      setEnabled(true);
    }
  }, [location.search, enabled]);

  const buffer = useMemo<CatechismDiagEvent[]>(() => getCatechismDiagBuffer(), [tick]);
  const persisted = useMemo<CatechismDiagEvent[]>(() => getPersistedCatechismErrors(), [tick]);

  if (!enabled) return null;

  return (
    <div
      data-testid="catechism-diagnostic-panel"
      className="fixed bottom-4 right-4 z-[200] w-[360px] max-w-[calc(100vw-2rem)] rounded-premium border border-primary/20 bg-background/95 backdrop-blur-md shadow-premium text-foreground"
    >
      <div className="flex items-center justify-between gap-spacing-xs px-spacing-md py-spacing-xs border-b border-border/60">
        <div className="flex items-center gap-spacing-xs">
          <span className="text-premium-xs font-black uppercase tracking-widest text-primary">
            Diagnóstico do Catecismo
          </span>
          <Badge variant="secondary" className="text-[9px]">DEV</Badge>
        </div>
        <div className="flex items-center gap-spacing-2xs">
          <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>
            {open ? '−' : '+'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              enableCatechismDebug(false);
              setEnabled(false);
            }}
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
              <div className="font-mono">{buffer.length} / persistidos: {persisted.length}</div>
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
                data-testid="catechism-diagnostic-export"
              >
                Exportar JSON
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[10px]"
                onClick={clearCatechismDiag}
              >
                Limpar
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[240px] rounded-premium border border-border/40 bg-muted/20">
            <ul className="p-spacing-xs space-y-spacing-2xs">
              {buffer.length === 0 && (
                <li className="text-muted-foreground italic text-premium-xs px-spacing-xs py-spacing-sm">
                  Nenhum evento ainda. Abra um parágrafo do Catecismo.
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
                    <span className="opacity-60 shrink-0">
                      {new Date(ev.ts).toLocaleTimeString()}
                    </span>
                    <span className="font-bold shrink-0">§{ev.paragraph}</span>
                    <span className="shrink-0">{ev.step}</span>
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
                      {new Date(ev.ts).toLocaleString()} · §{ev.paragraph} · {ev.step}
                      {ev.status !== undefined ? ` · ${ev.status}` : ''}
                      {ev.message ? ` · ${ev.message}` : ''}
                      {ev.route ? `  ← ${ev.route}` : ''}
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

export default CatechismDiagnosticPanel;
