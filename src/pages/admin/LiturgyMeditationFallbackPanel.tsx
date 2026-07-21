/**
 * LiturgyMeditationFallbackPanel — visão de telemetria dos eventos
 * `liturgy.meditation.fallback` capturados localmente (buffer persistido).
 *
 * Segmenta por `code` (ai_credits_exhausted, ai_rate_limited, ai_unavailable)
 * e `source` (local-cache, previous-day, local-builder), com alerta quando
 * há aumento anormal de `ai_credits_exhausted` nas últimas 24h.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import {
  readFallbackEvents,
  clearFallbackEvents,
  type FallbackEventLog,
} from '@/hooks/useLiturgyMeditation';
import { Button } from '@/components/ui/button';

const CODES = ['ai_credits_exhausted', 'ai_rate_limited', 'ai_unavailable'] as const;
const SOURCES = ['local-cache', 'previous-day', 'local-builder'] as const;

function bucketByHour(events: FallbackEventLog[], hours: number) {
  const cutoff = Date.now() - hours * 60 * 60_000;
  return events.filter((e) => new Date(e.at).getTime() > cutoff);
}

function countBy<T extends string>(events: FallbackEventLog[], key: keyof FallbackEventLog, values: readonly T[]) {
  return values.reduce<Record<T, number>>(
    (acc, v) => {
      acc[v] = events.filter((e) => e[key] === v).length;
      return acc;
    },
    Object.fromEntries(values.map((v) => [v, 0])) as Record<T, number>,
  );
}

const LiturgyMeditationFallbackPanel: React.FC = () => {
  const [events, setEvents] = useState<FallbackEventLog[]>([]);

  const reload = () => setEvents(readFallbackEvents());
  useEffect(() => { reload(); }, []);

  const last24h = useMemo(() => bucketByHour(events, 24), [events]);
  const last7d = useMemo(() => bucketByHour(events, 24 * 7), [events]);
  const previous24h = useMemo(() => {
    const now = Date.now();
    return events.filter((e) => {
      const t = new Date(e.at).getTime();
      return t > now - 48 * 60 * 60_000 && t <= now - 24 * 60 * 60_000;
    });
  }, [events]);

  const byCode24h = useMemo(() => countBy(last24h, 'code', CODES), [last24h]);
  const bySource24h = useMemo(() => countBy(last24h, 'source', SOURCES), [last24h]);
  const byCode7d = useMemo(() => countBy(last7d, 'code', CODES), [last7d]);

  const creditsSpike =
    byCode24h.ai_credits_exhausted > 0 &&
    byCode24h.ai_credits_exhausted >= 3 &&
    byCode24h.ai_credits_exhausted >= countBy(previous24h, 'code', CODES).ai_credits_exhausted * 2;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Fallback da Meditação Litúrgica</h1>
          <p className="text-sm text-muted-foreground">
            Telemetria local dos eventos <code className="text-xs">liturgy.meditation.fallback</code>.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={reload} aria-label="Recarregar eventos">
            <RefreshCw className="h-4 w-4" aria-hidden /> Atualizar
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => { clearFallbackEvents(); reload(); }}
            aria-label="Limpar buffer local"
          >
            <Trash2 className="h-4 w-4" aria-hidden /> Limpar
          </Button>
        </div>
      </header>

      {creditsSpike && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4"
        >
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" aria-hidden />
          <div>
            <p className="font-semibold text-destructive">Aumento anormal de créditos esgotados</p>
            <p className="text-sm text-muted-foreground">
              {byCode24h.ai_credits_exhausted} eventos <code>ai_credits_exhausted</code> nas últimas 24h
              (2× ou mais que o dia anterior). Verifique os créditos do Lovable AI Gateway.
            </p>
          </div>
        </div>
      )}

      <section aria-labelledby="por-codigo" className="grid gap-4 md:grid-cols-3">
        <h2 id="por-codigo" className="sr-only">Contagem por código nas últimas 24h</h2>
        {CODES.map((code) => (
          <div key={code} className="rounded-lg border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{code}</p>
            <p className="mt-1 text-3xl font-bold text-primary">{byCode24h[code]}</p>
            <p className="text-xs text-muted-foreground">7d: {byCode7d[code]}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="por-fonte" className="grid gap-4 md:grid-cols-3">
        <h2 id="por-fonte" className="sr-only">Contagem por fonte nas últimas 24h</h2>
        {SOURCES.map((source) => (
          <div key={source} className="rounded-lg border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{source}</p>
            <p className="mt-1 text-3xl font-bold text-primary">{bySource24h[source]}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="eventos-recentes">
        <h2 id="eventos-recentes" className="text-lg font-semibold mb-3">Eventos recentes</h2>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Nenhum evento registrado no buffer local ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left border-b">
                <tr>
                  <th className="p-2">Quando</th>
                  <th className="p-2">Data litúrgica</th>
                  <th className="p-2">Código</th>
                  <th className="p-2">Fonte</th>
                  <th className="p-2">Retry</th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 50).map((e, i) => (
                  <tr key={i} className="border-b last:border-b-0">
                    <td className="p-2 text-muted-foreground">{new Date(e.at).toLocaleString('pt-BR')}</td>
                    <td className="p-2">{e.iso_date}</td>
                    <td className="p-2"><code className="text-xs">{e.code}</code></td>
                    <td className="p-2"><code className="text-xs">{e.source}</code></td>
                    <td className="p-2 text-muted-foreground">{e.retry_at ? new Date(e.retry_at).toLocaleTimeString('pt-BR') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default LiturgyMeditationFallbackPanel;
