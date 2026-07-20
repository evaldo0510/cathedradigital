/**
 * Tipos editoriais das Orações (Sub-sprint 1 SEG).
 * Superset seguro sobre a linha do Supabase (`blocks` é JSON).
 */

export type PrayerBlockKind =
  | 'intro'
  | 'mystery'
  | 'station'
  | 'hour'
  | 'meditation'
  | 'prayer'
  | 'decade'
  | 'closing';

export interface PrayerBlockRef {
  bible?: string[];
  catechism?: number[];
}

export interface PrayerBlock {
  id: string;
  kind: PrayerBlockKind;
  order: number;
  title: string;
  subtitle?: string;
  /** Texto principal (parágrafos separados por linha em branco). */
  body?: string;
  /** Versão em latim, quando existir. */
  latin?: string;
  /** Meditação editorial (curta). */
  meditation?: string;
  /** Fruto espiritual proposto (Rosário). */
  fruit?: string;
  /** Repetições sugeridas (ex.: 10 Ave-Marias). */
  repeat?: { label: string; count: number; text?: string };
  refs?: PrayerBlockRef;
  /** URL de áudio pré-gerado; se ausente, o cliente chama `prayer-tts`. */
  audioUrl?: string;
}

export type PrayerCurationStatus = 'stub' | 'partial' | 'complete';

export function isPrayerBlockArray(value: unknown): value is PrayerBlock[] {
  return (
    Array.isArray(value) &&
    value.every(
      (b) =>
        b &&
        typeof b === 'object' &&
        typeof (b as PrayerBlock).id === 'string' &&
        typeof (b as PrayerBlock).kind === 'string' &&
        typeof (b as PrayerBlock).title === 'string',
    )
  );
}
