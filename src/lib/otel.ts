/**
 * OpenTelemetry — bootstrap opcional
 * ---------------------------------------------------------------
 * No-op por padrão. Só carrega o SDK web quando `VITE_OTEL_ENABLED=1`.
 * Isso mantém o bundle enxuto e não introduz nenhuma alteração
 * funcional enquanto o time não decidir ativar.
 *
 * Ver docs/OBSERVABILITY-OTEL.md para o desenho completo.
 */

type TraceDbFn = <T>(queryId: string, fn: () => Promise<T>) => Promise<T>;

const enabled = import.meta.env.VITE_OTEL_ENABLED === '1';

let tracer: any = null;

export async function initOtel(): Promise<void> {
  if (!enabled || typeof window === 'undefined') return;
  try {
    // Import dinâmico: só resolve se as libs foram instaladas.
    const dyn = (m: string) =>
      (new Function('m', 'return import(m)') as (m: string) => Promise<any>)(m);
    const api = await dyn('@opentelemetry/api');
    const web = await dyn('@opentelemetry/sdk-trace-web');
    const otlp = await dyn('@opentelemetry/exporter-trace-otlp-http');

    const provider = new web.WebTracerProvider({
      resource: {
        attributes: {
          'service.name':
            import.meta.env.VITE_OTEL_SERVICE_NAME ?? 'cathedra-web',
        },
      },
    });
    const endpoint =
      import.meta.env.VITE_OTEL_ENDPOINT ?? 'http://localhost:4318/v1/traces';
    provider.addSpanProcessor(
      new web.BatchSpanProcessor(new otlp.OTLPTraceExporter({ url: endpoint })),
    );
    provider.register();
    tracer = api.trace.getTracer('cathedra-web');
    // eslint-disable-next-line no-console
    console.info('[otel] inicializado →', endpoint);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[otel] libs ausentes ou falha no init; seguindo sem tracing.', e);
  }
}

/**
 * Envolve uma chamada de banco em um span nomeado.
 *
 * Uso:
 *   const res = await traceDb('app_metrics:window30d', () =>
 *     supabase.from('app_metrics').select(...)
 *   );
 *
 * Contrato: se OTel estiver desligado, é `fn()` puro — zero overhead
 * observável, nenhuma alteração de dados.
 */
export const traceDb: TraceDbFn = async (queryId, fn) => {
  if (!tracer) return fn();
  const span = tracer.startSpan(`db:${queryId}`, {
    attributes: {
      'db.system': 'postgresql',
      'db.query_id': queryId,
    },
  });
  const started = performance.now();
  try {
    const res = await fn();
    const rows = Array.isArray((res as any)?.data)
      ? (res as any).data.length
      : ((res as any)?.count ?? undefined);
    if (rows !== undefined) span.setAttribute('db.rows_returned', rows);
    span.setAttribute('perf.duration_ms', performance.now() - started);
    span.end();
    return res;
  } catch (err) {
    span.recordException(err as Error);
    span.setStatus({ code: 2, message: (err as Error).message });
    span.end();
    throw err;
  }
};
