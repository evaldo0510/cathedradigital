/**
 * Painel de debug rápido para visualizar as últimas falhas de request.
 *
 * Ativação:
 *  - localStorage: `debug:requests` = "1"
 *  - querystring: `?debug=requests`
 *
 * Intercepta `window.fetch` e registra respostas com status >= 400 ou
 * erros de rede. Botão flutuante no canto inferior direito abre a lista.
 * Zero impacto quando desativado (não instala o interceptor).
 */
import React from 'react';

type FailedRequest = {
  id: string;
  timestamp: number;
  method: string;
  url: string;
  status: number | 'network';
  statusText?: string;
  durationMs: number;
  bodyPreview?: string;
};

const MAX_ENTRIES = 30;
const STORE: FailedRequest[] = [];
const listeners = new Set<() => void>();
let installed = false;

function notify() {
  listeners.forEach((l) => l());
}

function push(entry: FailedRequest) {
  STORE.unshift(entry);
  if (STORE.length > MAX_ENTRIES) STORE.length = MAX_ENTRIES;
  notify();
}

/**
 * Redaction automática de tokens e PII antes de exibir ou exportar.
 * Aplicada em URL (querystring), body preview e mensagens.
 */
const SENSITIVE_QS_KEYS = /^(authorization|auth|token|access_token|refresh_token|id_token|apikey|api_key|key|secret|password|passwd|pwd|session|sig|signature)$/i;
const SENSITIVE_JSON_KEYS = /(authorization|auth|token|access_token|refresh_token|id_token|apikey|api_key|secret|password|passwd|pwd|session|cookie|set-cookie|bearer)/i;

function redactString(input: string): string {
  if (!input) return input;
  let s = input;
  // JWT (3 segmentos base64url separados por ponto)
  s = s.replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[JWT_REDACTED]');
  // Bearer / Basic tokens
  s = s.replace(/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi, '$1 [REDACTED]');
  // Emails
  s = s.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');
  // Chaves longas (>=32 chars) hex/base64-ish soltas
  s = s.replace(/\b[A-Za-z0-9_-]{40,}\b/g, (m) =>
    /^[0-9]+$/.test(m) ? m : '[TOKEN_REDACTED]'
  );
  // JSON: "chave_sensivel":"valor"
  s = s.replace(
    /"([^"]+)"\s*:\s*"([^"]*)"/g,
    (full, k, v) => (SENSITIVE_JSON_KEYS.test(k) ? `"${k}":"[REDACTED]"` : full)
  );
  return s;
}

function redactUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl, window.location.origin);
    url.searchParams.forEach((val, key) => {
      if (SENSITIVE_QS_KEYS.test(key)) url.searchParams.set(key, '[REDACTED]');
    });
    // Preserva host completo? Não — só path+search suficiente pra debug.
    return url.pathname + (url.search ? url.search.slice(0, 200) : '');
  } catch {
    return redactString(rawUrl).slice(0, 200);
  }
}

function redactFullUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl, window.location.origin);
    url.searchParams.forEach((val, key) => {
      if (SENSITIVE_QS_KEYS.test(key)) url.searchParams.set(key, '[REDACTED]');
    });
    return url.toString();
  } catch {
    return redactString(rawUrl);
  }
}

function shortUrl(u: string) {
  return redactUrl(u);
}

function installInterceptor() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const start = performance.now();
    const method = (init?.method || (typeof input !== 'string' && 'method' in (input as Request) ? (input as Request).method : 'GET') || 'GET').toUpperCase();
    const url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (input as Request).url);
    try {
      const res = await originalFetch(input as any, init);
      if (!res.ok) {
        let bodyPreview: string | undefined;
        try {
          const clone = res.clone();
          const txt = await clone.text();
          bodyPreview = txt.slice(0, 400);
        } catch {/* ignore */}
        push({
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          timestamp: Date.now(),
          method,
          url,
          status: res.status,
          statusText: res.statusText,
          durationMs: Math.round(performance.now() - start),
          bodyPreview,
        });
      }
      return res;
    } catch (err: any) {
      push({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        method,
        url,
        status: 'network',
        statusText: err?.message || 'Network error',
        durationMs: Math.round(performance.now() - start),
      });
      throw err;
    }
  };
}

function useEnabled() {
  const [enabled, setEnabled] = React.useState(false);
  React.useEffect(() => {
    try {
      const ls = window.localStorage.getItem('debug:requests') === '1';
      const qs = new URLSearchParams(window.location.search).get('debug') === 'requests';
      setEnabled(Boolean(ls || qs));
    } catch {
      setEnabled(false);
    }
  }, []);
  return [enabled, setEnabled] as const;
}

function useFailedRequests() {
  const [, force] = React.useReducer((n) => n + 1, 0);
  React.useEffect(() => {
    listeners.add(force);
    return () => { listeners.delete(force); };
  }, []);
  return STORE;
}

export const DebugRequestPanel: React.FC = () => {
  const [enabled, setEnabled] = useEnabled();
  const [open, setOpen] = React.useState(false);
  const entries = useFailedRequests();

  React.useEffect(() => {
    if (enabled) installInterceptor();
  }, [enabled]);

  if (!enabled) return null;

  const failCount = entries.length;

  return (
    <div className="fixed bottom-20 right-3 z-[9998] font-mono text-[11px]">
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full px-3 py-1.5 shadow-lg border border-rose-500/40 bg-rose-500/95 text-white font-bold uppercase tracking-widest hover:bg-rose-600 transition"
          aria-label="Abrir painel de debug de requests"
        >
          Debug · {failCount}
        </button>
      )}
      {open && (
        <div className="w-[min(92vw,420px)] max-h-[70vh] flex flex-col rounded-xl border border-rose-500/40 bg-background/98 backdrop-blur shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-rose-500/10">
            <div className="font-bold uppercase tracking-widest text-rose-700 dark:text-rose-300">
              Falhas de request ({failCount})
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { STORE.length = 0; notify(); }}
                className="text-rose-700 dark:text-rose-300 hover:underline"
              >
                limpar
              </button>
              <button
                type="button"
                onClick={() => {
                  try { window.localStorage.removeItem('debug:requests'); } catch {/* */}
                  setEnabled(false);
                  setOpen(false);
                }}
                className="text-muted-foreground hover:underline"
              >
                desligar
              </button>
              <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground hover:underline">
                fechar
              </button>
            </div>
          </div>
          <div className="overflow-auto flex-1 divide-y divide-border/40">
            {entries.length === 0 && (
              <div className="p-4 text-center text-muted-foreground italic">
                Nenhuma falha registrada ainda.
              </div>
            )}
            {entries.map((e) => {
              const time = new Date(e.timestamp).toLocaleTimeString();
              const statusLabel = e.status === 'network' ? 'NET' : String(e.status);
              return (
                <details key={e.id} className="px-3 py-2 hover:bg-muted/40">
                  <summary className="cursor-pointer flex items-center gap-2">
                    <span className="inline-block min-w-[38px] text-center px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold">
                      {statusLabel}
                    </span>
                    <span className="text-muted-foreground">{e.method}</span>
                    <span className="truncate flex-1" title={e.url}>{shortUrl(e.url)}</span>
                    <span className="text-muted-foreground shrink-0">{e.durationMs}ms</span>
                  </summary>
                  <div className="mt-2 space-y-1 pl-1">
                    <div><span className="text-muted-foreground">hora:</span> {time}</div>
                    <div className="break-all"><span className="text-muted-foreground">url:</span> {e.url}</div>
                    {e.statusText && (
                      <div><span className="text-muted-foreground">status:</span> {e.statusText}</div>
                    )}
                    {e.bodyPreview && (
                      <pre className="mt-1 max-h-40 overflow-auto rounded bg-muted/60 p-2 whitespace-pre-wrap break-all">
{e.bodyPreview}
                      </pre>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
          <div className="px-3 py-1.5 border-t border-border/60 text-[10px] text-muted-foreground bg-muted/30">
            Ativar: <code>?debug=requests</code> ou <code>localStorage.debug:requests=1</code>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugRequestPanel;
