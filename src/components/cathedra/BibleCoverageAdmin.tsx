import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BIBLE_CANON, type BibleBook } from '@/lib/bibleCanon';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Database, Cloud } from 'lucide-react';

interface CoverageRow {
  book: BibleBook;
  chapters: number;
  verses: number;
  source: 'local' | 'fallback';
}

/**
 * /admin/bible-coverage
 * Mostra, por livro canônico, quantos capítulos e versículos existem
 * em bible_chapters/bible_verses (local) e marca como "Fallback Bolls"
 * tudo que ainda não foi populado.
 */
export default function BibleCoverageAdmin() {
  const [rows, setRows] = useState<CoverageRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [{ data: books, error: e1 }, { data: chapters, error: e2 }, { data: verses, error: e3 }] = await Promise.all([
          supabase.from('bible_books').select('id, abbrev, name'),
          supabase.from('bible_chapters').select('id, book_id'),
          supabase.from('bible_verses').select('chapter_id'),
        ]);
        if (e1 || e2 || e3) throw e1 || e2 || e3;

        const chaptersByBook = new Map<string, Set<string>>();
        for (const c of chapters ?? []) {
          const set = chaptersByBook.get(c.book_id) ?? new Set();
          set.add(c.id);
          chaptersByBook.set(c.book_id, set);
        }
        const versesByChapter = new Map<string, number>();
        for (const v of verses ?? []) {
          versesByChapter.set(v.chapter_id, (versesByChapter.get(v.chapter_id) ?? 0) + 1);
        }
        const booksByAbbr = new Map((books ?? []).map((b) => [b.abbrev, b]));

        const result: CoverageRow[] = BIBLE_CANON.map((book) => {
          const dbBook = booksByAbbr.get(book.abbr);
          const chapterIds = dbBook ? chaptersByBook.get(dbBook.id) ?? new Set() : new Set<string>();
          const verseCount = Array.from(chapterIds).reduce(
            (sum, cid) => sum + (versesByChapter.get(cid) ?? 0),
            0
          );
          return {
            book,
            chapters: chapterIds.size,
            verses: verseCount,
            source: chapterIds.size > 0 ? 'local' : 'fallback',
          };
        });
        if (active) setRows(result);
      } catch (e: any) {
        if (active) setError(e?.message ?? 'Falha ao carregar cobertura');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return null;
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.book.name.toLowerCase().includes(q) || r.book.abbr.toLowerCase().includes(q));
  }, [rows, filter]);

  const stats = useMemo(() => {
    if (!rows) return null;
    const local = rows.filter((r) => r.source === 'local').length;
    return {
      total: rows.length,
      local,
      fallback: rows.length - local,
      verses: rows.reduce((s, r) => s + r.verses, 0),
    };
  }, [rows]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.18em] text-secondary mb-2">Bíblia · Operações</p>
        <h1 className="font-serif text-3xl md:text-4xl text-primary">Cobertura local da Escritura</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Quantos capítulos e versículos vivem no banco local versus quantos ainda dependem
          do fallback público (bolls.life · NAA).
        </p>
      </header>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Livros canônicos" value={stats.total} />
          <StatCard label="Locais" value={stats.local} tone="local" />
          <StatCard label="Fallback Bolls" value={stats.fallback} tone="fallback" />
          <StatCard label="Versículos locais" value={stats.verses.toLocaleString('pt-BR')} />
        </div>
      )}

      <Input
        placeholder="Filtrar por livro ou abreviação…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mb-4 max-w-sm"
      />

      <Card className="overflow-hidden border-primary/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Livro</th>
                <th className="text-left px-4 py-3">Abbr</th>
                <th className="text-right px-4 py-3">Capítulos</th>
                <th className="text-right px-4 py-3">Versículos</th>
                <th className="text-right px-4 py-3">Fonte</th>
              </tr>
            </thead>
            <tbody>
              {!filtered && !error && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    <Loader2 className="inline w-4 h-4 mr-2 animate-spin" />
                    Carregando cobertura…
                  </td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-destructive">{error}</td>
                </tr>
              )}
              {filtered?.map((r) => (
                <tr
                  key={r.book.abbr}
                  className="border-t border-border/40 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-2.5 font-medium text-primary">
                    {r.book.name}
                    {r.book.deuterocanonical && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-secondary">deutero</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{r.book.abbr}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.chapters}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.verses}</td>
                  <td className="px-4 py-2.5 text-right">
                    {r.source === 'local' ? (
                      <Badge variant="secondary" className="gap-1">
                        <Database className="w-3 h-3" /> local
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-muted-foreground">
                        <Cloud className="w-3 h-3" /> fallback
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number | string; tone?: 'local' | 'fallback' }) {
  const accent =
    tone === 'local'
      ? 'border-secondary/40 bg-secondary/5'
      : tone === 'fallback'
      ? 'border-muted-foreground/30 bg-muted/30'
      : 'border-primary/10 bg-card';
  return (
    <Card className={`p-4 ${accent}`}>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-serif text-2xl text-primary mt-1 tabular-nums">{value}</p>
    </Card>
  );
}
