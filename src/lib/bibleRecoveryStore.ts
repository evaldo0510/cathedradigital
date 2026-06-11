/**
 * Bible Recovery Mode — in-memory diagnostic store.
 *
 * Captura, em tempo real:
 *  - erros de navegação
 *  - capítulos incompletos / vazios
 *  - ocorrências de texto em inglês
 *
 * Sem persistência remota: zero impacto na navegação.
 */
import { FORBIDDEN_ENGLISH_WORDS } from '@/constants/language-config';

export type RecoveryEventType =
  | 'navigation_error'
  | 'empty_chapter'
  | 'incomplete_chapter'
  | 'english_text';

export interface RecoveryEvent {
  id: string;
  type: RecoveryEventType;
  book: string;
  chapter?: number;
  message: string;
  evidence?: string;
  timestamp: number;
}

type Listener = (events: RecoveryEvent[]) => void;

const MAX_EVENTS = 200;
let events: RecoveryEvent[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l(events);
}

export const bibleRecoveryStore = {
  list(): RecoveryEvent[] {
    return events;
  },
  subscribe(l: Listener) {
    listeners.add(l);
    l(events);
    return () => listeners.delete(l);
  },
  clear() {
    events = [];
    emit();
  },
  push(ev: Omit<RecoveryEvent, 'id' | 'timestamp'>) {
    events = [
      { ...ev, id: crypto.randomUUID(), timestamp: Date.now() },
      ...events,
    ].slice(0, MAX_EVENTS);
    emit();
  },
};

const FORBIDDEN_RX = new RegExp(
  `\\b(${FORBIDDEN_ENGLISH_WORDS.join('|')}|Tobit|Judith|Wisdom|Sirach|Baruch|Maccabees)\\b`,
  'i'
);

/** Inspect a chapter result and emit recovery events as needed. */
export function inspectChapterResult(
  book: string,
  chapter: number,
  verses: Array<{ number: number; text: string }> | null | undefined,
  expectedMinVerses = 1
) {
  if (!verses || verses.length === 0) {
    bibleRecoveryStore.push({
      type: 'empty_chapter',
      book,
      chapter,
      message: `Capítulo vazio: ${book} ${chapter}`,
    });
    return;
  }
  if (verses.length < expectedMinVerses) {
    bibleRecoveryStore.push({
      type: 'incomplete_chapter',
      book,
      chapter,
      message: `Capítulo incompleto: ${book} ${chapter} (${verses.length} versículos)`,
    });
  }
  for (const v of verses) {
    const m = FORBIDDEN_RX.exec(v.text || '');
    if (m) {
      bibleRecoveryStore.push({
        type: 'english_text',
        book,
        chapter,
        message: `Inglês detectado em ${book} ${chapter}:${v.number}`,
        evidence: `"${m[0]}" — ${(v.text || '').slice(0, 80)}…`,
      });
      break;
    }
  }
}

export function reportNavigationError(book: string, chapter: number | undefined, err: unknown) {
  bibleRecoveryStore.push({
    type: 'navigation_error',
    book,
    chapter,
    message: err instanceof Error ? err.message : String(err),
  });
}
