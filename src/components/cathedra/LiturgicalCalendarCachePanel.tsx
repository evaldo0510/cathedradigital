import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Icons } from '@/constants';
import {
  clearLiturgicalCalendarCache,
  listLiturgicalCalendarEntries,
  type LiturgicalCalendarEntryInfo,
} from '@/lib/offlineCache';
import {
  CacheMeta,
  getLiturgicalCacheStats,
  getLiturgicalCacheStatsForKey,
  LiturgicalCacheStats,
  resetLiturgicalCacheStats,
} from '@/hooks/useLiturgicalMonth';

interface Props {
  meta: CacheMeta;
  onAfterClear?: () => void;
}

const MONTH_NAMES_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const formatRemainingMs = (remaining: number): string => {
  if (remaining <= 0) return 'expirado';
  const hours = Math.floor(remaining / 3_600_000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h`;
  const mins = Math.max(1, Math.floor(remaining / 60_000));
  return `${mins}min`;
};

const formatRemaining = (meta: CacheMeta): string => {
  if (meta.cachedAt == null || meta.ageMs == null) return '—';
  return formatRemainingMs(meta.ttlMs - meta.ageMs);
};

const sourceLabel: Record<CacheMeta['source'], { label: string; tone: 'ok' | 'warn' | 'pending' }> = {
  'fresh-cache': { label: 'Cache fresco', tone: 'ok' },
  'stale-cache': { label: 'Cache expirado', tone: 'warn' },
  network: { label: 'Rede', tone: 'ok' },
  'network-after-stale': { label: 'Rede (após stale)', tone: 'ok' },
  pending: { label: 'Sem cache', tone: 'pending' },
};

interface EntryRow extends LiturgicalCalendarEntryInfo {
  stats: LiturgicalCacheStats;
}

const LiturgicalCalendarCachePanel: React.FC<Props> = ({ meta, onAfterClear }) => {
  const [stats, setStats] = useState<LiturgicalCacheStats>(getLiturgicalCacheStats());
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const list = await listLiturgicalCalendarEntries();
      if (!mounted) return;
      setStats(getLiturgicalCacheStats());
      setEntries(list.map((e) => ({ ...e, stats: getLiturgicalCacheStatsForKey(e.key) })));
    };
    refresh();
    const handler = () => { void refresh(); };
    window.addEventListener('cathedra-litcal-cache-updated', handler);
    window.addEventListener('cathedra_cache_updated', handler);
    const interval = window.setInterval(refresh, 10_000);
    return () => {
      mounted = false;
      window.removeEventListener('cathedra-litcal-cache-updated', handler);
      window.removeEventListener('cathedra_cache_updated', handler);
      window.clearInterval(interval);

    };
  }, []);

  const sl = sourceLabel[meta.source];
  const total = stats.hits + stats.misses + stats.staleHits;
  const hitRate = total > 0 ? Math.round((stats.hits / total) * 100) : 0;

  return (
    <div
      data-testid="liturgical-calendar-cache-panel"
      className="bg-card border border-border rounded-premium p-spacing-lg space-y-spacing-md"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-premium-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
          Cache do Calendário
        </h3>
        <span
          data-testid="litcal-cache-source"
          className={`text-premium-xs font-bold uppercase tracking-wider px-spacing-2xs py-spacing-3xs rounded-premium border ${
            sl.tone === 'ok'
              ? 'text-primary border-primary/30 bg-primary/5'
              : sl.tone === 'warn'
                ? 'text-amber-700 dark:text-amber-400 border-amber-500/40 bg-amber-500/10'
                : 'text-muted-foreground border-border bg-muted/40'
          }`}
        >
          {sl.label}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-spacing-sm text-premium-xs">
        <div>
          <dt className="text-muted-foreground uppercase tracking-wider text-[10px]">Hits</dt>
          <dd data-testid="litcal-cache-hits" className="font-mono font-bold text-foreground">{stats.hits}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground uppercase tracking-wider text-[10px]">Misses</dt>
          <dd data-testid="litcal-cache-misses" className="font-mono font-bold text-foreground">{stats.misses}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground uppercase tracking-wider text-[10px]">Stale hits</dt>
          <dd className="font-mono text-foreground/80">{stats.staleHits}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground uppercase tracking-wider text-[10px]">Hit rate</dt>
          <dd className="font-mono font-bold text-foreground">{hitRate}%</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted-foreground uppercase tracking-wider text-[10px]">TTL restante</dt>
          <dd data-testid="litcal-cache-ttl" className="font-mono text-foreground">
            {formatRemaining(meta)}
            {meta.cachedAt && (
              <span className="text-muted-foreground ml-spacing-2xs">
                · cacheado {new Date(meta.cachedAt).toLocaleString('pt-BR')}
              </span>
            )}
          </dd>
        </div>
      </dl>

      <div data-testid="litcal-cache-entries" className="space-y-spacing-2xs">
        <div className="flex items-center justify-between">
          <h4 className="text-muted-foreground uppercase tracking-wider text-[10px] font-bold">
            Meses em cache
          </h4>
          <span className="text-muted-foreground text-[10px] font-mono">{entries.length}</span>
        </div>
        {entries.length === 0 ? (
          <p className="text-premium-xs text-muted-foreground italic">Nenhum mês armazenado ainda.</p>
        ) : (
          <ul className="max-h-spacing-4xl overflow-auto rounded-premium border border-border/60 divide-y divide-border/60">
            {entries.map((e) => {
              const remaining = e.ttlMs - e.ageMs;
              const total = e.stats.hits + e.stats.misses + e.stats.staleHits;
              return (
                <li
                  key={e.key}
                  data-testid={`litcal-cache-entry-${e.year}-${String(e.month).padStart(2, '0')}`}
                  className="flex items-center justify-between gap-spacing-xs px-spacing-xs py-spacing-2xs text-premium-xs"
                >
                  <span className="font-mono font-bold text-foreground min-w-[64px]">
                    {MONTH_NAMES_SHORT[e.month - 1]}/{e.year}
                  </span>
                  <span className="font-mono text-foreground/80 flex-1 text-center">
                    <span className="text-primary">{e.stats.hits}h</span>
                    <span className="text-muted-foreground/60"> · </span>
                    <span className="text-amber-600 dark:text-amber-400">{e.stats.misses}m</span>
                    {e.stats.staleHits > 0 && (
                      <>
                        <span className="text-muted-foreground/60"> · </span>
                        <span className="text-muted-foreground">{e.stats.staleHits}s</span>
                      </>
                    )}
                    {total === 0 && <span className="text-muted-foreground/60">—</span>}
                  </span>
                  <span
                    className={`font-mono text-[10px] uppercase tracking-wider ${
                      e.isStale ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
                    }`}
                    title={`Cacheado em ${new Date(e.cachedAt).toLocaleString('pt-BR')}`}
                  >
                    {formatRemainingMs(remaining)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-[10px] text-muted-foreground/70 italic">
          h = hits · m = misses · s = stale hits
        </p>
      </div>



      <div className="flex gap-spacing-xs pt-spacing-xs border-t border-border">
        <Button
          data-testid="litcal-cache-clear"
          disabled={isClearing}
          aria-busy={isClearing}
          onClick={async () => {
            setIsClearing(true);
            const toastId = toast.loading('Limpando cache do calendário…');
            try {
              await clearLiturgicalCalendarCache();
              resetLiturgicalCacheStats();
              setStats(getLiturgicalCacheStats());
              toast.success('Cache do calendário limpo.', { id: toastId });
              onAfterClear?.();
            } catch (err) {
              console.error('Failed to clear liturgical cache:', err);
              toast.error('Não foi possível limpar o cache.', { id: toastId });
            } finally {
              setIsClearing(false);
            }
          }}
          className="text-premium-xs font-bold uppercase tracking-wider px-spacing-sm py-spacing-2xs rounded-premium-full border border-border hover:bg-muted transition-all flex items-center gap-spacing-2xs disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Icons.Cross className={`w-spacing-xs h-spacing-xs ${isClearing ? 'animate-spin' : ''}`} />
          {isClearing ? 'Limpando…' : 'Limpar cache'}
        </Button>
      </div>

    </div>
  );
};

export default LiturgicalCalendarCachePanel;
