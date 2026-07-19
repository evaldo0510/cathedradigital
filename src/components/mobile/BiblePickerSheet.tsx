import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, ArrowLeft } from "lucide-react";
import { MobileSheet } from "./MobileSheet";
import { BIBLE_DATA, type BibleBook } from "@/data/bible-books";
import { buildBibleUrl } from "@/lib/bibleUrl";
import { cn } from "@/lib/utils";

const LAST_KEY = "cathedra:bible:last";

export type BibleLastRead = { abbr: string; chapter: number };

export function getBibleLastRead(): BibleLastRead | null {
  try {
    const raw = localStorage.getItem(LAST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.abbr === "string" && Number.isFinite(parsed.chapter)) {
      return parsed as BibleLastRead;
    }
  } catch {}
  return null;
}

export function setBibleLastRead(last: BibleLastRead) {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify(last));
  } catch {}
}

type Testament = keyof typeof BIBLE_DATA;

interface BiblePickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Se true, ao escolher, dispara `onSelect` e não navega. */
  selectionOnly?: boolean;
  onSelect?: (sel: BibleLastRead) => void;
}

/**
 * BiblePickerSheet — bottom-sheet mobile para seleção de Livro → Capítulo.
 * Reusa BIBLE_DATA e buildBibleUrl. Persiste a última leitura em localStorage.
 */
export function BiblePickerSheet({
  open,
  onOpenChange,
  selectionOnly = false,
  onSelect,
}: BiblePickerSheetProps) {
  const navigate = useNavigate();
  const [testament, setTestament] = useState<Testament>("Novo Testamento");
  const [book, setBook] = useState<BibleBook | null>(null);

  useEffect(() => {
    if (!open) return;
    // Ao abrir, reseta para escolha de livro; pré-seleciona testamento pelo último lido.
    const last = getBibleLastRead();
    if (last) {
      for (const t of Object.keys(BIBLE_DATA) as Testament[]) {
        const found = BIBLE_DATA[t].some((c) =>
          c.books.some((b) => b.abbr.toLowerCase() === last.abbr.toLowerCase()),
        );
        if (found) {
          setTestament(t);
          break;
        }
      }
    }
    setBook(null);
  }, [open]);

  const categories = useMemo(() => BIBLE_DATA[testament] ?? [], [testament]);

  const handleChapter = (chapter: number) => {
    if (!book) return;
    const sel: BibleLastRead = { abbr: book.abbr, chapter };
    setBibleLastRead(sel);
    onOpenChange(false);
    if (selectionOnly && onSelect) {
      onSelect(sel);
    } else {
      navigate(buildBibleUrl({ abbr: book.abbr, chapter }));
    }
  };

  return (
    <MobileSheet
      open={open}
      onOpenChange={onOpenChange}
      title={book ? book.name : "Escolher passagem"}
      description={book ? `Selecione um capítulo (${book.chapters})` : "Livro e capítulo"}
      size="full"
    >
      {!book ? (
        <div className="space-y-6">
          {/* Testamento */}
          <div className="flex gap-2 border-b border-stitch-outline-variant/30">
            {(Object.keys(BIBLE_DATA) as Testament[]).map((t) => {
              const active = t === testament;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTestament(t)}
                  aria-pressed={active}
                  className={cn(
                    "relative -mb-px px-3 py-2.5 font-stitch-body text-[12px] font-bold uppercase tracking-[0.15em] transition-colors",
                    active
                      ? "text-stitch-primary"
                      : "text-stitch-on-surface-variant hover:text-stitch-primary",
                  )}
                >
                  {t}
                  {active && (
                    <span className="absolute inset-x-0 -bottom-px h-[2px] bg-stitch-secondary" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Livros */}
          {categories.map((cat) => (
            <div key={cat.name}>
              <p className="mb-2 font-stitch-body text-[11px] font-bold uppercase tracking-[0.15em] text-stitch-on-surface-variant">
                {cat.name}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {cat.books.map((b) => (
                  <button
                    key={b.abbr}
                    type="button"
                    onClick={() => setBook(b)}
                    style={{ minHeight: "var(--stitch-mobile-touch-min)" }}
                    className={cn(
                      "flex flex-col items-start justify-center rounded-md border border-stitch-outline-variant/30",
                      "bg-stitch-surface-container-lowest px-3 py-2 text-left transition-colors",
                      "hover:border-stitch-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stitch-secondary",
                    )}
                  >
                    <span className="font-stitch-display text-[15px] leading-tight text-stitch-primary">
                      {b.name}
                    </span>
                    <span className="mt-0.5 font-stitch-body text-[10px] font-bold uppercase tracking-[0.12em] text-stitch-on-surface-variant">
                      {b.abbr} · {b.chapters}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setBook(null)}
            className="inline-flex items-center gap-2 font-stitch-body text-[13px] font-bold uppercase tracking-[0.15em] text-stitch-secondary hover:text-stitch-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Trocar livro
          </button>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
            {Array.from({ length: book.chapters }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleChapter(n)}
                style={{
                  minHeight: "var(--stitch-mobile-touch-min)",
                  minWidth: "var(--stitch-mobile-touch-min)",
                }}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-md border border-stitch-outline-variant/30",
                  "bg-stitch-surface-container-lowest font-stitch-display text-[16px] text-stitch-primary",
                  "transition-colors hover:border-stitch-secondary hover:bg-stitch-secondary-container",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stitch-secondary",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {!book && (
        <p className="mt-6 flex items-center gap-2 border-t border-stitch-outline-variant/30 pt-4 font-stitch-body text-[12px] italic text-stitch-on-surface-variant">
          <BookOpen className="h-4 w-4 text-stitch-secondary" />
          Toque num livro para escolher o capítulo.
        </p>
      )}
    </MobileSheet>
  );
}
