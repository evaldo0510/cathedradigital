import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Icons } from '@/constants';
import {
  clearExpiredLiturgicalCalendarEntries,
  clearLiturgicalCalendarCache,
  deleteLiturgicalCalendarEntry,
  estimateLiturgicalCalendarStorage,
  getAllFromStore,
  listLiturgicalCalendarEntries,
  type LiturgicalCalendarEntryInfo,
  type LiturgicalCalendarStorageEstimate,
} from '@/lib/offlineCache';
import {
  CacheMeta,
  getLiturgicalCacheStats,
  getLiturgicalCacheStatsByKey,
  getLiturgicalCacheStatsForKey,
  LiturgicalCacheStats,
  resetLiturgicalCacheStats,
  resetLiturgicalCacheStatsForKey,
} from '@/hooks/useLiturgicalMonth';

interface Props {
  meta: CacheMeta;
  onAfterClear?: () => void;
}

const MONTH_NAMES_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/** Limite "soft" para destacar uso elevado do cache do calendário (≈2 MB). */
const STORAGE_WARN_BYTES = 2 * 1024 * 1024;
/** Limite "hard" — perto do que o navegador costuma bloquear (≈5 MB). */
const STORAGE_DANGER_BYTES = 5 * 1024 * 1024;

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

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
  const [storage, setStorage] = useState<LiturgicalCalendarStorageEstimate>({
    bytes: 0, entries: 0, quotaBytes: null, usageBytes: null,
  });
  const [isClearing, setIsClearing] = useState(false);
  const [isClearingExpired, setIsClearingExpired] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const [confirmingRemoveKey, setConfirmingRemoveKey] = useState<string | null>(null);
  const [confirmingClearExpired, setConfirmingClearExpired] = useState(false);
  const [lastSummary, setLastSummary] = useState<
    | { kind: 'remove' | 'clear-expired'; labels: string[]; at: number }
    | null
  >(null);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const [list, est] = await Promise.all([
        listLiturgicalCalendarEntries(),
        estimateLiturgicalCalendarStorage(),
      ]);
      if (!mounted) return;
      setStats(getLiturgicalCacheStats());
      setEntries(list.map((e) => ({ ...e, stats: getLiturgicalCacheStatsForKey(e.key) })));
      setStorage(est);
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
  const expiredCount = entries.filter((e) => e.isStale).length;

  const storageLevel: 'ok' | 'warn' | 'danger' =
    storage.bytes >= STORAGE_DANGER_BYTES ? 'danger'
    : storage.bytes >= STORAGE_WARN_BYTES ? 'warn'
    : 'ok';

  const storageToneClass = storageLevel === 'danger'
    ? 'text-destructive border-destructive/40 bg-destructive/10'
    : storageLevel === 'warn'
      ? 'text-amber-700 dark:text-amber-400 border-amber-500/40 bg-amber-500/10'
      : 'text-primary border-primary/30 bg-primary/5';

  const handleExport = async () => {
    setIsExporting(true);
    const toastId = toast.loading('Exportando cache do calendário…');
    try {
      const raw = await getAllFromStore('liturgical-calendar');
      const payload = {
        version: 1,
        kind: 'cathedra-liturgical-calendar-cache',
        exportedAt: new Date().toISOString(),
        storage: {
          bytes: storage.bytes,
          entries: storage.entries,
        },
        totals: getLiturgicalCacheStats(),
        perKey: getLiturgicalCacheStatsByKey(),
        entries: entries.map((e) => ({
          key: e.key,
          calendar: e.calendar,
          lang: e.lang,
          year: e.year,
          month: e.month,
          cachedAt: e.cachedAt,
          cachedAtISO: new Date(e.cachedAt).toISOString(),
          ageMs: e.ageMs,
          ttlMs: e.ttlMs,
          remainingMs: e.ttlMs - e.ageMs,
          isStale: e.isStale,
          stats: e.stats,
          data: raw.find((r) => r.key === e.key)?.data ?? null,
        })),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.href = url;
      a.download = `cathedra-litcal-cache-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Cache exportado para download.', { id: toastId });
    } catch (err) {
      console.error('Failed to export liturgical cache:', err);
      toast.error('Não foi possível exportar o cache.', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearExpired = async () => {
    setIsClearingExpired(true);
    const toastId = toast.loading('Removendo meses vencidos…');
    try {
      const removed = await clearExpiredLiturgicalCalendarEntries();
      removed.forEach((k) => resetLiturgicalCacheStatsForKey(k));
      if (removed.length === 0) {
        toast.info('Nenhum mês vencido para remover.', { id: toastId });
      } else {
        toast.success(`${removed.length} mês(es) vencidos removidos.`, { id: toastId });
      }
    } catch (err) {
      console.error('Failed to clear expired liturgical entries:', err);
      toast.error('Não foi possível remover os meses vencidos.', { id: toastId });
    } finally {
      setIsClearingExpired(false);
    }
  };

  const handleClearAll = async () => {
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
  };

  const handleRemoveOne = async (entry: EntryRow) => {
    setRemovingKey(entry.key);
    const label = `${MONTH_NAMES_SHORT[entry.month - 1]}/${entry.year}`;
    const toastId = toast.loading(`Removendo ${label}…`);
    try {
      await deleteLiturgicalCalendarEntry(entry.key);
      resetLiturgicalCacheStatsForKey(entry.key);
      toast.success(`${label} removido do cache.`, { id: toastId });
    } catch (err) {
      console.error('Failed to delete liturgical entry:', err);
      toast.error(`Não foi possível remover ${label}.`, { id: toastId });
    } finally {
      setRemovingKey(null);
    }
  };

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

      <div
        data-testid="litcal-cache-storage"
        className={`rounded-premium border px-spacing-sm py-spacing-xs ${storageToneClass}`}
      >
        <div className="flex items-center justify-between gap-spacing-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider">Armazenamento</span>
          <span
            data-testid="litcal-cache-storage-bytes"
            className="font-mono font-bold text-premium-xs"
          >
            {formatBytes(storage.bytes)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-spacing-xs mt-spacing-3xs">
          <span className="text-[10px] opacity-80">
            {storage.entries} entrada{storage.entries === 1 ? '' : 's'}
            {storage.quotaBytes && storage.usageBytes != null && (
              <> · global {formatBytes(storage.usageBytes)} / {formatBytes(storage.quotaBytes)}</>
            )}
          </span>
          {storageLevel !== 'ok' && (
            <span data-testid="litcal-cache-storage-warning" className="text-[10px] font-bold uppercase tracking-wider">
              {storageLevel === 'danger' ? 'Limite próximo' : 'Uso elevado'}
            </span>
          )}
        </div>
      </div>

      <div data-testid="litcal-cache-entries" className="space-y-spacing-2xs">
        <div className="flex items-center justify-between">
          <h4 className="text-muted-foreground uppercase tracking-wider text-[10px] font-bold">
            Meses em cache
          </h4>
          <span className="text-muted-foreground text-[10px] font-mono">
            {entries.length}{expiredCount > 0 && ` · ${expiredCount} vencido${expiredCount === 1 ? '' : 's'}`}
          </span>
        </div>
        {entries.length === 0 ? (
          <p className="text-premium-xs text-muted-foreground italic">Nenhum mês armazenado ainda.</p>
        ) : (
          <ul className="max-h-spacing-4xl overflow-auto rounded-premium border border-border/60 divide-y divide-border/60">
            {entries.map((e) => {
              const remaining = e.ttlMs - e.ageMs;
              const total = e.stats.hits + e.stats.misses + e.stats.staleHits;
              const isRemoving = removingKey === e.key;
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
                  <button
                    type="button"
                    data-testid={`litcal-cache-entry-remove-${e.year}-${String(e.month).padStart(2, '0')}`}
                    disabled={isRemoving}
                    aria-busy={isRemoving}
                    aria-label={`Remover ${MONTH_NAMES_SHORT[e.month - 1]}/${e.year} do cache`}
                    onClick={() => handleRemoveOne(e)}
                    className="text-[10px] font-bold uppercase tracking-wider px-spacing-2xs py-spacing-3xs rounded-premium-full border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRemoving ? '…' : 'Remover'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-[10px] text-muted-foreground/70 italic">
          h = hits · m = misses · s = stale hits
        </p>
      </div>

      <div className="flex flex-wrap gap-spacing-xs pt-spacing-xs border-t border-border">
        <Button
          data-testid="litcal-cache-export"
          disabled={isExporting || entries.length === 0}
          aria-busy={isExporting}
          onClick={handleExport}
          className="text-premium-xs font-bold uppercase tracking-wider px-spacing-sm py-spacing-2xs rounded-premium-full border border-border hover:bg-muted transition-all flex items-center gap-spacing-2xs disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Icons.Download className={`w-spacing-xs h-spacing-xs ${isExporting ? 'animate-pulse' : ''}`} />
          {isExporting ? 'Exportando…' : 'Exportar JSON'}
        </Button>

        <Button
          data-testid="litcal-cache-clear-expired"
          disabled={isClearingExpired || expiredCount === 0}
          aria-busy={isClearingExpired}
          onClick={handleClearExpired}
          className="text-premium-xs font-bold uppercase tracking-wider px-spacing-sm py-spacing-2xs rounded-premium-full border border-border hover:bg-muted transition-all flex items-center gap-spacing-2xs disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Icons.Cross className={`w-spacing-xs h-spacing-xs ${isClearingExpired ? 'animate-spin' : ''}`} />
          {isClearingExpired
            ? 'Removendo…'
            : `Limpar vencidos${expiredCount > 0 ? ` (${expiredCount})` : ''}`}
        </Button>

        <Button
          data-testid="litcal-cache-clear"
          disabled={isClearing}
          aria-busy={isClearing}
          onClick={handleClearAll}
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
