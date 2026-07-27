/**
 * Reporta métricas de sanitização do FAQ do Glossário para
 * observabilidade em dev e produção.
 *
 * - Envia evento `glossary_faq_sanitized` via `trackEvent` (gtag + buffer).
 * - Adiciona breadcrumb no Sentry quando disponível; em produção, dispara
 *   `captureMessage` de nível `warning` se houve descartes.
 * - Em dev, também loga um resumo no console.
 */

import * as Sentry from '@sentry/react';
import { trackEvent } from '@/lib/analytics';
import type { SanitizeFaqStats } from './sanitizeFaq';

export interface FaqMetricsContext {
  route: string;
  slug?: string;
}

export function reportFaqMetrics(ctx: FaqMetricsContext, stats: SanitizeFaqStats): void {
  if (!stats || stats.total === 0) return;

  const payload = {
    route: ctx.route,
    slug: ctx.slug ?? null,
    total: stats.total,
    kept: stats.kept,
    dropped: stats.dropped,
    normalized: stats.normalized,
  };

  try {
    trackEvent('glossary_faq_sanitized', payload);
  } catch {
    /* nunca deixa métrica quebrar a página */
  }

  try {
    Sentry.addBreadcrumb({
      category: 'glossary.faq',
      level: stats.dropped > 0 ? 'warning' : 'info',
      message: `FAQ sanitized ${ctx.route}`,
      data: payload,
    });
    // Só reporta como evento se houve descartes reais (evita ruído)
    if (!import.meta.env.DEV && stats.dropped > 0) {
      Sentry.captureMessage(
        `Glossary FAQ dropped ${stats.dropped}/${stats.total} items on ${ctx.route}`,
        { level: 'warning', extra: payload },
      );
    }
  } catch {
    /* Sentry pode não estar inicializado */
  }
}
