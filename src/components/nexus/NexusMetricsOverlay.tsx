/**
 * NexusMetricsOverlay — indicador flutuante (canto inferior direito)
 * exibido apenas em desenvolvimento (`import.meta.env.DEV`).
 *
 * Objetivo: medir o ganho do cache LRU dos adapters do Nexus
 * (glossary/journey) em tempo real — resolutions, taxa de cache hit,
 * tempo médio e último tempo por adapter.
 *
 * Zero impacto em produção: em builds prod, o componente retorna null.
 * Colapsável e minimizável para não atrapalhar o layout.
 */
import * as React from 'react';
import {
  getNexusMetricsSnapshot,
  subscribeNexusMetrics,
  resetNexusMetrics,
  hitRate,
  type NexusMetricsSnapshot,
} from '@/core/knowledge/adapters/nexusMetrics';

const STORAGE_KEY = 'cathedra:nexus-metrics-overlay:open';

function formatMs(ms: number): string {
  if (!Number.isFinite(ms) || ms === 0) return '—';
  return ms < 1 ? '<1ms' : `${ms.toFixed(1)}ms`;
}

function formatPct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

/** Baixa o snapshot atual como `nexus-metrics-<timestamp>.json`. */
function exportSnapshotAsJson(snap: NexusMetricsSnapshot): void {
  const now = new Date();
  const iso = now.toISOString();
  const stamp = iso.replace(/[:.]/g, '-');
  const payload = {
    generatedAt: iso,
    adapters: {
      glossaryAutoNexus: { ...snap.glossary, hitRate: hitRate(snap.glossary) },
      journeyAutoNexus: { ...snap.journey, hitRate: hitRate(snap.journey) },
    },
    totals: {
      hits: snap.glossary.hits + snap.journey.hits,
      misses: snap.glossary.misses + snap.journey.misses,
    },
  };
  try {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-metrics-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    /* browsers antigos ou contexto sem DOM — no-op */
  }
}

export const NexusMetricsOverlay: React.FC = () => {
  if (!import.meta.env.DEV) return null;

  const [snap, setSnap] = React.useState<NexusMetricsSnapshot>(() =>
    getNexusMetricsSnapshot(),
  );
  const [open, setOpen] = React.useState<boolean>(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) !== '0';
    } catch {
      return true;
    }
  });

  React.useEffect(() => subscribeNexusMetrics(setSnap), []);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, open ? '1' : '0');
    } catch {
      /* ignore quota errors in ephemeral contexts */
    }
  }, [open]);

  const rows = [
    { key: 'glossary' as const, label: 'Glossário' },
    { key: 'journey' as const, label: 'Jornada' },
  ];

  return (
    <div
      role="complementary"
      aria-label="Métricas do Nexus (dev only)"
      className="pointer-events-auto fixed bottom-3 right-3 z-[9999] select-none rounded-lg border border-stitch-outline-variant/40 bg-stitch-surface/95 font-mono text-[11px] text-stitch-on-surface shadow-lg backdrop-blur"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="nexus-metrics-body"
        className="flex w-full items-center justify-between gap-3 rounded-t-lg px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stitch-secondary"
      >
        <span className="font-stitch-body text-[10px] uppercase tracking-widest text-stitch-secondary">
          Nexus · dev
        </span>
        <span aria-hidden="true">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div id="nexus-metrics-body" className="border-t border-stitch-outline-variant/30 p-3">
          <table className="border-collapse text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-stitch-on-surface-variant">
                <th className="pr-3">Adapter</th>
                <th className="pr-3">Hits</th>
                <th className="pr-3">Miss</th>
                <th className="pr-3">Hit rate</th>
                <th className="pr-3">Avg</th>
                <th>Último</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ key, label }) => {
                const m = snap[key];
                return (
                  <tr key={key} className="align-top">
                    <td className="pr-3 py-0.5 font-semibold">{label}</td>
                    <td className="pr-3 py-0.5">{m.hits}</td>
                    <td className="pr-3 py-0.5">{m.misses}</td>
                    <td className="pr-3 py-0.5">{formatPct(hitRate(m))}</td>
                    <td className="pr-3 py-0.5">{formatMs(m.avgMs)}</td>
                    <td className="py-0.5">{formatMs(m.lastMs)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-2 flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => exportSnapshotAsJson(snap)}
              aria-label="Exportar métricas do Nexus como JSON"
              className="rounded border border-stitch-outline-variant/40 px-2 py-0.5 text-[10px] uppercase tracking-widest text-stitch-on-surface-variant transition-colors hover:border-stitch-secondary/60 hover:text-stitch-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stitch-secondary"
            >
              Exportar JSON
            </button>
            <button
              type="button"
              onClick={resetNexusMetrics}
              className="rounded border border-stitch-outline-variant/40 px-2 py-0.5 text-[10px] uppercase tracking-widest text-stitch-on-surface-variant transition-colors hover:border-stitch-secondary/60 hover:text-stitch-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stitch-secondary"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NexusMetricsOverlay;
