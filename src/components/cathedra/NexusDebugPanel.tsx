/**
 * Painel de debug do Nexus.
 *
 * Liga com:
 *  - localStorage: `nexus:debug` = "1"
 *  - querystring: `?debug=nexus`
 *
 * Mostra correlationId, payload enviado e payload bruto da resposta —
 * útil principalmente em mobile, onde abrir DevTools é custoso.
 */
import React from 'react';

export interface NexusDebugInfo {
  correlationId?: string;
  startedAt?: number;
  endedAt?: number;
  request?: unknown;
  response?: unknown;
  error?: string;
  source?: string;
}

export function useNexusDebugEnabled(): boolean {
  const [enabled, setEnabled] = React.useState(false);
  React.useEffect(() => {
    try {
      const ls = typeof window !== 'undefined' && window.localStorage.getItem('nexus:debug') === '1';
      const qs = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === 'nexus';
      setEnabled(Boolean(ls || qs));
    } catch {
      setEnabled(false);
    }
  }, []);
  return enabled;
}

export const NexusDebugPanel: React.FC<{ info: NexusDebugInfo }> = ({ info }) => {
  const enabled = useNexusDebugEnabled();
  if (!enabled) return null;

  const ms = info.startedAt && info.endedAt ? `${Math.round(info.endedAt - info.startedAt)}ms` : '—';
  const copy = (data: unknown) => {
    try {
      navigator.clipboard?.writeText(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    } catch {/* ignore */}
  };

  return (
    <details className="mt-spacing-md rounded-premium border border-amber-500/30 bg-amber-500/[0.04] text-[11px] font-mono leading-snug">
      <summary className="cursor-pointer px-spacing-sm py-spacing-2xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300">
        🛠 Debug Nexus · {ms} {info.source ? `· ${info.source}` : ''}
      </summary>
      <div className="p-spacing-sm space-y-spacing-xs">
        <Row label="correlationId" value={info.correlationId} onCopy={() => copy(info.correlationId)} />
        {info.error && <Row label="error" value={info.error} />}
        <Block title="request" data={info.request} onCopy={() => copy(info.request)} />
        <Block title="response" data={info.response} onCopy={() => copy(info.response)} />
      </div>
    </details>
  );
};

const Row: React.FC<{ label: string; value?: unknown; onCopy?: () => void }> = ({ label, value, onCopy }) => (
  <div className="flex items-center gap-spacing-xs">
    <span className="text-amber-800/70 dark:text-amber-300/70 min-w-[90px]">{label}:</span>
    <code className="truncate text-foreground/80">{String(value ?? '—')}</code>
    {onCopy && value !== undefined && (
      <button type="button" onClick={onCopy} className="ml-auto text-amber-700 hover:underline">copy</button>
    )}
  </div>
);

const Block: React.FC<{ title: string; data: unknown; onCopy: () => void }> = ({ title, data, onCopy }) => (
  <div>
    <div className="flex items-center gap-spacing-xs mb-spacing-2xs">
      <span className="text-amber-800/70 dark:text-amber-300/70">{title}:</span>
      <button type="button" onClick={onCopy} className="text-amber-700 hover:underline">copy</button>
    </div>
    <pre className="max-h-40 overflow-auto rounded bg-background/60 p-spacing-2xs border border-amber-500/20 whitespace-pre-wrap break-all">
{data == null ? '—' : (typeof data === 'string' ? data : JSON.stringify(data, null, 2))}
    </pre>
  </div>
);
