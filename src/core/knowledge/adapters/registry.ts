/**
 * Registro central de todos os ReaderAutoNexus.
 *
 * Import este módulo uma vez (no bootstrap) para que qualquer consumidor
 * possa recuperar o adapter certo via `ReaderAutoNexusRegistry.get(kind)`.
 *
 * Ao adicionar um novo domínio, basta implementar o adapter e registrá-lo aqui.
 */

import {
  ReaderAutoNexusRegistry,
  type ReaderAutoNexus,
  type ReaderAutoNexusOutput,
  type ReaderNexusBucket,
  BUCKET_LABEL,
} from './ReaderAutoNexus';

import { bibleReaderAutoNexus } from './bibleAutoNexus';
import { catechismReaderAutoNexus } from './catechismAutoNexus';
import { magisteriumReaderAutoNexus } from './magisteriumAutoNexus';
import { saintReaderAutoNexus } from './saintAutoNexus';
import { liturgyReaderAutoNexus } from './liturgyAutoNexus';

// Wrappers para os 3 adapters legados: adaptam a assinatura ao contrato ReaderAutoNexus.
import { resolvePrayerAutoNexus, type PrayerNexusInput } from './prayerAutoNexus';
import { resolveAutoNexus, type GlossaryLike } from './glossaryAutoNexus';
import { resolveJourneyAutoNexus, type JourneyLike } from './journeyAutoNexus';

const prayerReaderAutoNexus: ReaderAutoNexus<PrayerNexusInput> = {
  kind: 'prayer',
  label: 'Oração',
  buildSuggestions(input) {
    const r = resolvePrayerAutoNexus(input);
    return {
      selfId: r.selfId,
      suggestions: r.suggestions,
      byBucket: r.byBucket as ReaderAutoNexusOutput['byBucket'],
      labels: BUCKET_LABEL,
    };
  },
};

const glossaryReaderAutoNexus: ReaderAutoNexus<GlossaryLike> = {
  kind: 'glossary',
  label: 'Verbete',
  buildSuggestions(input) {
    const r = resolveAutoNexus(input);
    // Deriva sugestões (1 por bucket) a partir do byKind já resolvido.
    const buckets: ReaderNexusBucket[] = [
      'bible', 'catechism', 'magisterium', 'saint', 'prayer', 'journey',
    ];
    const suggestions = buckets
      .map((b) => r.byKind[b]?.[0])
      .filter((n): n is NonNullable<typeof n> => !!n?.url)
      .map((n, i) => ({
        intent: i === 0 ? ('study' as const) : ('deepen' as const),
        eyebrow: BUCKET_LABEL[n.node.kind as ReaderNexusBucket] ?? 'Continuar',
        label: n.node.label,
        target: n,
        weight: 1,
      }));
    return {
      selfId: r.selfId,
      suggestions,
      byBucket: r.byKind as ReaderAutoNexusOutput['byBucket'],
      labels: r.labels,
    };
  },
};

const journeyReaderAutoNexus: ReaderAutoNexus<JourneyLike> = {
  kind: 'journey',
  label: 'Jornada',
  buildSuggestions(input) {
    const r = resolveJourneyAutoNexus(input);
    const suggestions = Object.entries(r.byKind)
      .flatMap(([, arr]) => (arr[0] ? [arr[0]] : []))
      .filter((n) => !!n.url)
      .slice(0, 6)
      .map((n, i) => ({
        intent: i === 0 ? ('apply' as const) : ('study' as const),
        eyebrow: r.labels[n.node.kind] ?? 'Continuar',
        label: n.node.label,
        target: n,
        weight: 1,
      }));
    return {
      selfId: null,
      suggestions,
      byBucket: r.byKind as ReaderAutoNexusOutput['byBucket'],
      labels: r.labels,
    };
  },
};

let registered = false;

export function registerReaderAutoNexusAdapters(): void {
  if (registered) return;
  registered = true;
  ReaderAutoNexusRegistry.register(bibleReaderAutoNexus);
  ReaderAutoNexusRegistry.register(catechismReaderAutoNexus);
  ReaderAutoNexusRegistry.register(magisteriumReaderAutoNexus);
  ReaderAutoNexusRegistry.register(saintReaderAutoNexus);
  ReaderAutoNexusRegistry.register(liturgyReaderAutoNexus);
  ReaderAutoNexusRegistry.register(prayerReaderAutoNexus);
  ReaderAutoNexusRegistry.register(glossaryReaderAutoNexus);
  ReaderAutoNexusRegistry.register(journeyReaderAutoNexus);
}

// Auto-registra em qualquer import — barato, idempotente.
registerReaderAutoNexusAdapters();
