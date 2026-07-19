/**
 * AtriumBibleReader — Etapa 3 (reskin Stitch, tela 5 "Bíblia").
 *
 * Estratégia de não-substituição:
 *  - Sem params → landing editorial (hero + testamentos + livros) usando tokens stitch-*.
 *  - Com params (book/view) → delega ao leitor existente (BibleReadGate → Bible),
 *    preservando toda a lógica atual sem duplicação.
 */

import React, { lazy, Suspense, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, Search as SearchIcon, ArrowRight } from 'lucide-react';
import { BIBLE_DATA, type BibleBook } from '@/data/bible-books';
import { buildBibleUrl } from '@/lib/bibleUrl';
import { AppRoute } from '@/types';
import BibleReadGate from '@/components/cathedra/BibleReadGate';
import { BibleSkeleton } from '@/components/cathedra/RouteSkeletons';
import EditorialReaderChrome from '@/components/editorial/EditorialReaderChrome';

const Bible = lazy(() => import('@/components/cathedra/Bible'));

type Testament = 'Antigo Testamento' | 'Novo Testamento';

const TESTAMENT_META: Record<Testament, { kicker: string; blurb: string }> = {
  'Antigo Testamento': {
    kicker: 'Primeira Aliança',
    blurb: 'Da Criação à espera do Messias — a preparação divina para a plenitude dos tempos.',
  },
  'Novo Testamento': {
    kicker: 'Aliança em Cristo',
    blurb: 'Os Evangelhos, a vida da Igreja nascente e a consumação da promessa.',
  },
};

function findBookByAbbr(abbr: string | null): BibleBook | undefined {
  if (!abbr) return undefined;
  for (const t of Object.values(BIBLE_DATA)) {
    for (const cat of t) {
      const found = cat.books.find((b) => b.abbr.toLowerCase() === abbr.toLowerCase());
      if (found) return found;
    }
  }
  return undefined;
}

const AtriumBibleReader: React.FC = () => {
  const [sp] = useSearchParams();
  const hasReaderParams = sp.get('book') || sp.get('view');

  if (hasReaderParams) {
    const abbr = sp.get('book');
    const chapter = sp.get('chapter') ?? sp.get('c');
    const book = findBookByAbbr(abbr);
    const title = book ? book.name : 'Sagrada Escritura';
    const subtitle = chapter ? `Capítulo ${chapter}` : undefined;
    return (
      <Suspense fallback={<BibleSkeleton />}>
        <EditorialReaderChrome
          kicker="Cathedra · Lectio Divina"
          title={title}
          subtitle={subtitle}
          backHref={AppRoute.BIBLE}
        />
        <BibleReadGate>
          <Bible />
        </BibleReadGate>
      </Suspense>
    );
  }

  return <BibleLanding />;
};


const BibleLanding: React.FC = () => {
  const [testament, setTestament] = useState<Testament>('Antigo Testamento');

  const categories = useMemo(() => BIBLE_DATA[testament] ?? [], [testament]);
  const bookCount = useMemo(
    () => categories.reduce((acc, c) => acc + c.books.length, 0),
    [categories],
  );

  return (
    <div
      className="min-h-screen w-full bg-stitch-background text-stitch-on-background"
      style={{
        backgroundImage: 'url("https://www.transparenttextures.com/patterns/p6.png")',
      }}
    >
      <Helmet>
        <title>Cathedra — Sagrada Escritura</title>
        <meta
          name="description"
          content="Bíblia católica com notas, cruzamentos e Lectio Divina. Antigo e Novo Testamento em leitura contemplativa."
        />
        <meta property="og:title" content="Cathedra — Sagrada Escritura" />
      </Helmet>

      <main className="mx-auto w-full max-w-[1120px] px-5 pb-16 pt-10 md:px-16 md:pt-14 animate-fade-in">
        {/* Hero */}
        <section className="border-b border-stitch-secondary/10 pb-8">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <span className="mb-2 block font-stitch-body text-[12px] font-bold uppercase tracking-[0.32em] text-stitch-secondary">
                Sacred Scripture
              </span>
              <h1 className="font-stitch-display text-[32px] italic leading-[40px] text-stitch-primary md:text-[48px] md:leading-[56px] md:tracking-[-0.02em]">
                Sagrada Escritura
              </h1>
              <p className="mt-4 font-stitch-body text-[20px] leading-[32px] text-stitch-on-surface-variant">
                Setenta e três livros, uma só Palavra. Percorra a narrativa da
                Aliança, do Gênesis ao Apocalipse, iluminada pela Tradição.
              </p>
            </div>
            <Link
              to={AppRoute.BUSCAR}
              className="group relative flex w-full items-center gap-3 rounded-lg border border-stitch-outline-variant/40 bg-stitch-surface-container-low px-4 py-2.5 text-[14px] font-medium text-stitch-on-surface-variant transition-all hover:border-stitch-secondary md:w-64"
            >
              <SearchIcon className="h-5 w-5 shrink-0" />
              <span className="font-stitch-body">Buscar passagem…</span>
            </Link>
          </div>
        </section>

        {/* Testament switcher */}
        <section className="pt-10">
          <div className="flex flex-wrap items-center gap-2 border-b border-stitch-outline-variant/30">
            {(Object.keys(TESTAMENT_META) as Testament[]).map((t) => {
              const active = t === testament;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTestament(t)}
                  className={[
                    'relative -mb-px px-4 py-3 font-stitch-body text-[13px] font-bold uppercase tracking-[0.18em] transition-colors',
                    active
                      ? 'text-stitch-primary'
                      : 'text-stitch-on-surface-variant hover:text-stitch-primary',
                  ].join(' ')}
                  aria-pressed={active}
                >
                  {t}
                  {active && (
                    <span className="absolute inset-x-0 -bottom-px h-[2px] bg-stitch-secondary" />
                  )}
                </button>
              );
            })}
            <div className="ml-auto hidden font-stitch-body text-[12px] font-bold uppercase tracking-[0.15em] text-stitch-on-surface-variant md:inline">
              {String(bookCount).padStart(2, '0')} Livros
            </div>
          </div>

          <div className="mt-4 max-w-2xl font-stitch-body text-[15px] italic text-stitch-on-surface-variant">
            <span className="mr-2 font-bold not-italic uppercase tracking-[0.15em] text-stitch-secondary">
              {TESTAMENT_META[testament].kicker}.
            </span>
            {TESTAMENT_META[testament].blurb}
          </div>
        </section>

        {/* Categorias e livros */}
        <section className="pt-10 space-y-14">
          {categories.map((cat) => (
            <div key={cat.name}>
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-stitch-display text-[24px] leading-[32px] text-stitch-primary">
                    {cat.name}
                  </h2>
                  {cat.description && (
                    <p className="mt-1 max-w-xl font-stitch-body text-[14px] text-stitch-on-surface-variant">
                      {cat.description}
                    </p>
                  )}
                </div>
                <div className="hidden h-px flex-1 bg-stitch-secondary/20 md:mx-6 md:block" />
                <span className="shrink-0 font-stitch-body text-[12px] font-bold uppercase tracking-[0.15em] text-stitch-on-surface-variant">
                  {String(cat.books.length).padStart(2, '0')} Livros
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {cat.books.map((book: BibleBook, i: number) => (
                  <Link
                    key={book.abbr}
                    to={buildBibleUrl({ abbr: book.abbr, chapter: 1 })}
                    className="group relative flex aspect-[3/4] flex-col justify-between overflow-hidden border border-stitch-outline-variant/20 bg-stitch-surface-container-lowest p-4 transition-all hover:border-stitch-secondary hover:shadow-lg hover:shadow-black/[0.05]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-stitch-primary/[0.03] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="relative">
                      <span className="font-stitch-display text-[48px] italic leading-none text-stitch-secondary/30">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="relative">
                      <h3 className="font-stitch-display text-[18px] leading-tight text-stitch-primary transition-colors group-hover:text-stitch-secondary">
                        {book.name}
                      </h3>
                      <p className="mt-1 font-stitch-body text-[11px] font-bold uppercase tracking-[0.15em] text-stitch-on-surface-variant">
                        {book.abbr} · {book.chapters} cap.
                      </p>
                      <div className="mt-3 flex items-center justify-between text-stitch-secondary opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="font-stitch-body text-[11px] uppercase tracking-[0.15em]">
                          Abrir
                        </span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Rodapé contemplativo */}
        <section className="mt-16 flex items-center gap-4 border-t border-stitch-secondary/10 pt-8 text-stitch-on-surface-variant">
          <BookOpen className="h-5 w-5 text-stitch-secondary" />
          <p className="font-stitch-body text-[14px] italic">
            "Tua palavra é lâmpada para os meus pés, luz para o meu caminho." — Sl 119, 105
          </p>
        </section>
      </main>
    </div>
  );
};

export default AtriumBibleReader;
