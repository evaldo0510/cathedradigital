/**
 * Analytics de Coleções — eventos editoriais para gtag/GA4 + Sentry breadcrumb.
 *
 * Emitidos apenas no cliente. Silenciosos em SSR/dev sem gtag. Nunca lançam.
 *
 * Eventos padronizados:
 * - `collection_completed`      → 100% dos itens concluídos, Nexus recomendações visíveis
 * - `collection_prerequisites_viewed` → seção de pré-requisitos renderizada e visível
 * - `collection_certificate_completed` → trilha `certificate_eligible` finalizada
 * - `collection_search_result_clicked` → clique em card de coleção na busca do Acervo
 */

export type CollectionAnalyticsEvent =
  | 'collection_completed'
  | 'collection_prerequisites_viewed'
  | 'collection_certificate_completed'
  | 'collection_search_result_clicked';

export interface CollectionEventPayload {
  collection_id?: string;
  collection_slug?: string;
  collection_title?: string;
  category?: string | null;
  difficulty_level?: string | null;
  estimated_reading_time_minutes?: number | null;
  items_total?: number;
  items_completed?: number;
  has_certificate?: boolean;
  extra?: Record<string, unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Gtag = (...args: any[]) => void;

function getGtag(): Gtag | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = (window as any).gtag;
  return typeof g === 'function' ? g : null;
}

function getSentry(): { addBreadcrumb: (b: unknown) => void } | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = (window as any).Sentry;
  return s && typeof s.addBreadcrumb === 'function' ? s : null;
}

export function trackCollectionEvent(
  event: CollectionAnalyticsEvent,
  payload: CollectionEventPayload = {},
): void {
  try {
    const gtag = getGtag();
    if (gtag) {
      gtag('event', event, {
        collection_id: payload.collection_id,
        collection_slug: payload.collection_slug,
        collection_title: payload.collection_title,
        category: payload.category ?? undefined,
        difficulty_level: payload.difficulty_level ?? undefined,
        estimated_reading_time_minutes:
          payload.estimated_reading_time_minutes ?? undefined,
        items_total: payload.items_total,
        items_completed: payload.items_completed,
        has_certificate: payload.has_certificate,
        ...(payload.extra ?? {}),
      });
    }
    const sentry = getSentry();
    if (sentry) {
      sentry.addBreadcrumb({
        category: 'collections',
        type: 'info',
        level: 'info',
        message: event,
        data: payload,
      });
    }
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug('[collections/analytics]', event, payload);
    }
  } catch {
    // Analytics jamais quebra a UI
  }
}
