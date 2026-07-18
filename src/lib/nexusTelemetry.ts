/**
 * Nexus telemetry — STAB-NEXUS-P0 (Etapa 5).
 *
 * Registra os 4 eventos-chave da experiência do Nexus:
 *   nexus.shown        → painel montado com >=1 bubble navegável
 *   nexus.click        → usuário clicou em um bubble
 *   nexus.destination  → navegação concluída (rota final resolvida)
 *   nexus.failed       → bubble não pôde ser resolvido em rota
 *
 * Reutiliza a tabela `analytics_events` já em uso por
 * `catechismDiagnostics.ts` e `Bible.tsx` — nenhum backend novo.
 * Silencia erros de gravação para não poluir o console de produção.
 */
import { supabase } from '@/integrations/supabase/client';

export type NexusTelemetryEvent =
  | 'nexus.shown'
  | 'nexus.click'
  | 'nexus.destination'
  | 'nexus.failed';

interface NexusEventBase {
  tagId?: string;
  tagSlug?: string;
  from?: string;
}

export interface NexusShownPayload extends NexusEventBase {
  itemCount: number;
  kinds: string[];
}

export interface NexusClickPayload extends NexusEventBase {
  type: string;
  id?: string;
  destination?: string;
}

export interface NexusDestinationPayload extends NexusEventBase {
  type: string;
  id?: string;
  url: string;
}

export interface NexusFailedPayload extends NexusEventBase {
  type: string;
  id?: string;
  reason: string;
}

type NexusPayload =
  | NexusShownPayload
  | NexusClickPayload
  | NexusDestinationPayload
  | NexusFailedPayload;

const emit = async (event: NexusTelemetryEvent, payload: NexusPayload) => {
  // Dev: log estruturado para facilitar E2E e debugging local.
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(`[Nexus] ${event}`, payload);
  }
  try {
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from('analytics_events').insert({
      event_name: event,
      user_id: userData?.user?.id ?? null,
      metadata: {
        ...payload,
        path: typeof window !== 'undefined'
          ? window.location.pathname + window.location.search
          : null,
      } as any,
    } as any);
  } catch {
    /* silent — telemetria nunca deve quebrar UX */
  }
};

export const trackNexusShown = (p: NexusShownPayload) => emit('nexus.shown', p);
export const trackNexusClick = (p: NexusClickPayload) => emit('nexus.click', p);
export const trackNexusDestination = (p: NexusDestinationPayload) =>
  emit('nexus.destination', p);
export const trackNexusFailed = (p: NexusFailedPayload) =>
  emit('nexus.failed', p);
