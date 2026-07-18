/**
 * Continuation telemetry — três eventos oficiais.
 *
 * Fase 0: apenas assinatura estável. A camada visual (ReaderContinuation)
 * ainda emite eventos pelo `telemetry.log` global; a Fase 9 migra
 * completamente para estes helpers.
 */

import { telemetry } from '@/utils/navigation-telemetry';
import type {
  ContinuationContext,
  ContinuationSuggestion,
} from './types';

export interface ContinuationShownPayload {
  kind: ContinuationContext['kind'];
  source: 'graph' | 'fallback' | 'mixed';
  count: number;
  intents: ContinuationSuggestion['intent'][];
  averageScore: number;
}

export interface ContinuationClickPayload {
  kind: ContinuationContext['kind'];
  source: ContinuationSuggestion['source'];
  intent: ContinuationSuggestion['intent'];
  href: string;
  score: number;
  confidence: ContinuationSuggestion['confidence'];
  position: number;
}

export interface ContinuationDismissedPayload {
  kind: ContinuationContext['kind'];
  source: 'graph' | 'fallback' | 'mixed';
  count: number;
  intents: ContinuationSuggestion['intent'][];
  reason: 'scroll-past' | 'navigate-away' | 'timeout';
}

export const continuationTelemetry = {
  shown(payload: ContinuationShownPayload) {
    telemetry.log('continuation.shown', 'info', payload);
  },
  click(payload: ContinuationClickPayload) {
    telemetry.log('continuation.click', 'info', payload);
  },
  dismissed(payload: ContinuationDismissedPayload) {
    telemetry.log('continuation.dismissed', 'info', payload);
  },
};
