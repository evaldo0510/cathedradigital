/**
 * Telemetria estruturada para falhas do Prayer Engine.
 * Coleta contexto rico (slug, params, sessão, hierarquia) e envia para
 * console + Sentry + analytics_events via runtimeErrorLogger.
 *
 * Sprint · Bug React #300 (/oracao/rosario contemplative)
 */
import * as Sentry from '@sentry/react';
import { trackNavigationError } from '@/lib/telemetry';

export interface PrayerErrorContext {
  slug?: string | null;
  searchParams?: Record<string, string>;
  userId?: string | null;
  engineVersion?: number | null;
  hierarchyStatus?: 'idle' | 'loading' | 'ready' | 'error';
  blocksCount?: number;
  activeSectionSlug?: string | null;
  mysteriesCount?: number;
  route?: string;
}

/**
 * Registra falha de renderização/hook do Prayer com contexto completo.
 * Retorna refId para exibição ao usuário.
 */
export function reportPrayerError(
  error: Error,
  ctx: PrayerErrorContext,
  extra?: { componentStack?: string },
): string {
  const payload = {
    ...ctx,
    error_name: error.name,
    error_message: error.message,
    react_error_code: extractReactErrorCode(error.message),
    ts: new Date().toISOString(),
  };

  // Console estruturado — visível em dev e no console dos usuários.
  // eslint-disable-next-line no-console
  console.error('[PrayerEngine:error]', payload, error);

  Sentry.withScope((scope) => {
    scope.setTag('surface', 'prayer-engine');
    scope.setTag('prayer_slug', ctx.slug ?? 'unknown');
    if (payload.react_error_code) {
      scope.setTag('react_error_code', payload.react_error_code);
    }
    scope.setContext('prayer_context', payload as Record<string, unknown>);
    Sentry.captureException(error, {
      extra: { componentStack: extra?.componentStack ?? null },
    });
  });

  // Reaproveita pipeline global (retorna refId e persiste em analytics_events).
  return trackNavigationError(error, {
    componentStack: extra?.componentStack,
    ...payload,
  } as never);
}

/**
 * Loga contexto de diagnóstico sem erro (breadcrumb) — útil para reproduzir
 * o estado exato antes de uma falha React #300.
 */
export function logPrayerDiagnostics(label: string, ctx: PrayerErrorContext): void {
  if (typeof window === 'undefined') return;
  // eslint-disable-next-line no-console
  console.debug('[PrayerEngine:diag]', label, ctx);
  Sentry.addBreadcrumb({
    category: 'prayer-engine',
    level: 'info',
    message: label,
    data: ctx as Record<string, unknown>,
  });
}

function extractReactErrorCode(message: string): string | null {
  // "Minified React error #300" ou "Error: Minified React error #185"
  const m = message.match(/Minified React error #(\d+)/);
  return m ? `#${m[1]}` : null;
}

export function serializeSearchParams(sp: URLSearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  sp.forEach((v, k) => {
    // Sanitiza tokens conhecidos.
    if (/token|secret|key|password/i.test(k)) {
      out[k] = '[REDACTED]';
    } else {
      out[k] = v;
    }
  });
  return out;
}
