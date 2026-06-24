import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle, Copy, Check, History, AlertTriangle } from 'lucide-react';

interface ValidateResponse {
  input: string;
  normalized: string;
  canonical_abbr: string | null;
  book_name: string | null;
  bollsId: number | null;
  testament: 'OT' | 'NT' | null;
  deuterocanonical: boolean | null;
  resolved: boolean;
  reason?: string;
}

const HISTORY_KEY = 'bibleAbbrValidateHistory:v1';
const HISTORY_LIMIT = 10;
const MAX_LENGTH = 64;
const REQUEST_TIMEOUT_MS = 8000;
const ONLY_PUNCT_RE = /^[^\p{L}\p{N}]+$/u;

type LocalError = { kind: 'empty' | 'too_long' | 'only_punct'; message: string };

function validateLocal(raw: string): LocalError | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { kind: 'empty', message: 'Digite uma abreviação para validar.' };
  }
  if (trimmed.length > MAX_LENGTH) {
    return {
      kind: 'too_long',
      message: `Abreviação excede ${MAX_LENGTH} caracteres (${trimmed.length}).`,
    };
  }
  if (ONLY_PUNCT_RE.test(trimmed)) {
    return {
      kind: 'only_punct',
      message: 'Entrada contém apenas pontuação/espaços — informe letras e/ou dígitos.',
    };
  }
  return null;
}

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string').slice(0, HISTORY_LIMIT) : [];
  } catch {
    return [];
  }
}

export async function copyToClipboard(value: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    if (typeof document === 'undefined') return false;
    const ta = document.createElement('textarea');
    ta.value = value;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand?.('copy') ?? false;
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function CopyButton({ value, label }: { value: string | number | null; label: string }) {
  const [copied, setCopied] = useState(false);
  const disabled = value === null || value === undefined || value === '';
  // Stable per-label toast id prevents duplicate persistent toasts on rapid clicks.
  const toastId = `bible-abbr-copy:${label}`;
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      disabled={disabled}
      onClick={async () => {
        if (disabled) return;
        const str = String(value);
        const ok = await copyToClipboard(str);
        if (ok) {
          setCopied(true);
          // Dismiss any previous persistent toast for this label before showing a new one.
          toast.dismiss(toastId);
          toast.success(`${label} copiado`, {
            id: toastId,
            description: str,
            duration: Infinity,
            closeButton: true,
          });
          setTimeout(() => setCopied(false), 1500);
        } else {
          toast.dismiss(toastId);
          toast.error('Não foi possível copiar', { id: toastId });
        }
      }}
      aria-label={`Copiar ${label}`}
      className="h-7 px-2 gap-1"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-primary" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      <span className="text-xs">{copied ? 'Copiado' : 'Copiar'}</span>
    </Button>
  );
}


export default function BibleAbbrValidatePage() {
  const [input, setInput] = useState('2 Cr');
  const [data, setData] = useState<ValidateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>(() => loadHistory());
  const requestIdRef = useRef(0);

  const trimmed = useMemo(() => input.trim(), [input]);
  const localError = useMemo(() => validateLocal(input), [input]);

  const pushHistory = useCallback((entry: string) => {
    setHistory((prev) => {
      const next = [entry, ...prev.filter((x) => x !== entry)].slice(0, HISTORY_LIMIT);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (localError) {
      setData(null);
      setRemoteError(null);
      setLoading(false);
      return;
    }
    const reqId = ++requestIdRef.current;
    const t = setTimeout(async () => {
      setLoading(true);
      setRemoteError(null);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const { data: res, error: invokeErr } = await supabase.functions.invoke(
          'bible-abbr-validate',
          { body: { abbrev: trimmed } },
        );
        clearTimeout(timeoutId);
        if (reqId !== requestIdRef.current) return;
        if (invokeErr) {
          const ctx = (invokeErr as unknown as { context?: { json?: () => Promise<unknown> } }).context;
          if (ctx?.json) {
            try {
              const body = (await ctx.json()) as ValidateResponse;
              setData(body);
              setRemoteError(null);
              pushHistory(trimmed);
              return;
            } catch {
              /* fall through */
            }
          }
          setRemoteError(invokeErr.message ?? 'Erro ao chamar a função');
          setData(null);
          return;
        }
        setData(res as ValidateResponse);
        pushHistory(trimmed);
      } catch (e) {
        clearTimeout(timeoutId);
        if (reqId !== requestIdRef.current) return;
        const aborted = e instanceof Error && (e.name === 'AbortError' || /abort/i.test(e.message));
        setRemoteError(
          aborted
            ? `Tempo esgotado (>${REQUEST_TIMEOUT_MS / 1000}s) ao validar. Verifique sua conexão e tente novamente.`
            : e instanceof Error
              ? e.message
              : 'Erro de rede desconhecido.',
        );
        setData(null);
      } finally {
        if (reqId === requestIdRef.current) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [trimmed, localError, pushHistory]);

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">
          Validador de Abreviações Bíblicas
        </h1>
        <p className="text-sm text-muted-foreground">
          Digite uma abreviação (ex.: <code className="px-1 rounded bg-muted">2 Cr</code>,{' '}
          <code className="px-1 rounded bg-muted">1 tm</code>,{' '}
          <code className="px-1 rounded bg-muted">Mt</code>) para validar a normalização
          em tempo real via <code className="px-1 rounded bg-muted">bible-abbr-validate</code>.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entrada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="abbr-input" className="sr-only">Abreviação</Label>
          <div className="relative">
            <Input
              id="abbr-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ex.: 2 Cr, 1 Tm, Mt, Sl"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              maxLength={MAX_LENGTH + 16}
              aria-invalid={localError ? true : undefined}
              aria-describedby={localError ? 'abbr-local-error' : undefined}
              className="pr-9"
            />
            {loading && (
              <Loader2
                className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground"
                aria-label="Validando"
              />
            )}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {input.trim().length}/{MAX_LENGTH} caracteres
            </span>
            {loading && <span aria-live="polite">Consultando edge function…</span>}
          </div>
          {localError && (
            <p
              id="abbr-local-error"
              role="alert"
              className="flex items-start gap-1.5 text-sm text-destructive"
            >
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
              <span>{localError.message}</span>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Resultado</CardTitle>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Carregando" />}
          {!loading && !localError && data?.resolved && (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              Resolvido
            </Badge>
          )}
          {!loading && !localError && data && !data.resolved && (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3.5 w-3.5" aria-hidden />
              Não reconhecido
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {localError && (
            <p className="text-sm text-muted-foreground">Corrija a entrada para validar.</p>
          )}
          {!localError && !data && !remoteError && !loading && (
            <p className="text-sm text-muted-foreground">Aguardando entrada…</p>
          )}
          {!localError && remoteError && (
            <p className="flex items-start gap-1.5 text-sm text-destructive" role="alert">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
              <span>{remoteError}</span>
            </p>
          )}
          {!localError && data && (
            <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm items-center">
              <dt className="text-muted-foreground">Input</dt>
              <dd className="font-mono">{JSON.stringify(data.input)}</dd>

              <dt className="text-muted-foreground">Normalized</dt>
              <dd className="font-mono">{JSON.stringify(data.normalized)}</dd>

              <dt className="text-muted-foreground">canonical_abbr</dt>
              <dd className="flex items-center gap-2">
                <span className="font-mono">{data.canonical_abbr ?? '—'}</span>
                {data.canonical_abbr && <CopyButton value={data.canonical_abbr} label="canonical_abbr" />}
              </dd>

              <dt className="text-muted-foreground">book_name</dt>
              <dd>{data.book_name ?? '—'}</dd>

              <dt className="text-muted-foreground">bollsId</dt>
              <dd className="flex items-center gap-2">
                <span className="font-mono">{data.bollsId ?? '—'}</span>
                {data.bollsId !== null && <CopyButton value={data.bollsId} label="bollsId" />}
              </dd>

              <dt className="text-muted-foreground">testament</dt>
              <dd>
                {data.testament ? (
                  <Badge variant="secondary">
                    {data.testament === 'OT' ? 'Antigo Testamento' : 'Novo Testamento'}
                  </Badge>
                ) : (
                  '—'
                )}
              </dd>

              {data.deuterocanonical && (
                <>
                  <dt className="text-muted-foreground">Deuterocanônico</dt>
                  <dd><Badge variant="outline">sim</Badge></dd>
                </>
              )}

              {data.reason && (
                <>
                  <dt className="text-muted-foreground">Razão</dt>
                  <dd className="text-destructive">{data.reason}</dd>
                </>
              )}
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" aria-hidden />
            Histórico
          </CardTitle>
          {history.length > 0 && (
            <Button type="button" size="sm" variant="ghost" onClick={clearHistory} className="h-7 px-2 text-xs">
              Limpar
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma consulta ainda. Validações bem-sucedidas aparecem aqui (últimas {HISTORY_LIMIT}).
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {history.map((entry) => (
                <li key={entry}>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setInput(entry)}
                    className="h-7 px-2 font-mono text-xs"
                    aria-label={`Revalidar "${entry}"`}
                  >
                    {entry}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
