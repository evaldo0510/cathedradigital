import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

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

/**
 * Playground simples para validar abreviações bíblicas em tempo real
 * contra a edge function `bible-abbr-validate`. Útil para debugar a
 * normalização (ex.: "2 Cr" → "2Cr") sem disparar a rota completa de texto.
 */
export default function BibleAbbrValidatePage() {
  const [input, setInput] = useState('2 Cr');
  const [data, setData] = useState<ValidateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = useMemo(() => input.trim(), [input]);

  useEffect(() => {
    if (!trimmed) {
      setData(null);
      setError(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: res, error: invokeErr } = await supabase.functions.invoke(
          'bible-abbr-validate',
          { body: { abbrev: trimmed } },
        );
        if (cancelled) return;
        if (invokeErr) {
          // supabase-js trata 404 como erro mas o body do edge ainda chega via context.
          // Tentamos extrair o JSON do response anexado quando disponível.
          // Caso contrário, exibimos mensagem genérica.
          const ctx = (invokeErr as unknown as { context?: { json?: () => Promise<unknown> } }).context;
          if (ctx?.json) {
            try {
              const body = (await ctx.json()) as ValidateResponse;
              setData(body);
              setError(null);
              return;
            } catch {
              // fallthrough
            }
          }
          setError(invokeErr.message ?? 'Erro ao chamar a função');
          setData(null);
          return;
        }
        setData(res as ValidateResponse);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erro desconhecido');
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [trimmed]);

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
          <Input
            id="abbr-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex.: 2 Cr, 1 Tm, Mt, Sl"
            autoFocus
            autoComplete="off"
            spellCheck={false}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Resultado</CardTitle>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Carregando" />}
          {!loading && data?.resolved && (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              Resolvido
            </Badge>
          )}
          {!loading && data && !data.resolved && (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3.5 w-3.5" aria-hidden />
              Não reconhecido
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {!trimmed && (
            <p className="text-sm text-muted-foreground">Aguardando entrada…</p>
          )}
          {error && (
            <p className="text-sm text-destructive" role="alert">{error}</p>
          )}
          {data && (
            <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Input</dt>
              <dd className="font-mono">{JSON.stringify(data.input)}</dd>

              <dt className="text-muted-foreground">Normalized</dt>
              <dd className="font-mono">{JSON.stringify(data.normalized)}</dd>

              <dt className="text-muted-foreground">canonical_abbr</dt>
              <dd className="font-mono">{data.canonical_abbr ?? '—'}</dd>

              <dt className="text-muted-foreground">book_name</dt>
              <dd>{data.book_name ?? '—'}</dd>

              <dt className="text-muted-foreground">bollsId</dt>
              <dd className="font-mono">{data.bollsId ?? '—'}</dd>

              <dt className="text-muted-foreground">testament</dt>
              <dd>
                {data.testament ? (
                  <Badge variant="secondary">{data.testament === 'OT' ? 'Antigo Testamento' : 'Novo Testamento'}</Badge>
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
    </div>
  );
}
