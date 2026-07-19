/**
 * AtriumBuscarPage — Etapa 4 (reskin Stitch, "Pesquisa/Logos").
 *
 * Regras:
 *  - Landing editorial com tokens `stitch-*` quando não há query.
 *  - Delegação ao GlobalSearchPage existente quando há `?q=` (não duplica lógica).
 *  - Header/footer globais vêm do App shell.
 *  - Versão anterior segue em /buscar-legacy.
 */

import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search as SearchIcon,
  BookOpen,
  BookMarked,
  Sparkles,
  Users,
  MessageCircle,
  Tag as TagIcon,
  ArrowRight,
  BookMarked as BookFilterIcon,
} from 'lucide-react';
import { AppRoute } from '@/types';
import { MobileTopBar } from '@/components/mobile/MobileTopBar';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { BiblePickerSheet } from '@/components/mobile/BiblePickerSheet';

const GlobalSearchPage = lazy(
  () => import('@/components/cathedra/GlobalSearchPage'),
);

type Territory = {
  title: string;
  meta: string;
  description: string;
  to: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const TERRITORIES: Territory[] = [
  {
    title: 'Sagrada Escritura',
    meta: '73 Livros',
    description: 'Pesquise versículos, temas e figuras bíblicas.',
    to: AppRoute.BIBLE,
    Icon: BookOpen,
  },
  {
    title: 'Catecismo',
    meta: '2865 Parágrafos',
    description: 'Localize a doutrina por parágrafo, tema ou palavra-chave.',
    to: AppRoute.CATECHISM,
    Icon: BookMarked,
  },
  {
    title: 'Santos & Padres',
    meta: 'Vida e Escritos',
    description: 'Encontre testemunhos, festas e obras.',
    to: AppRoute.SAINTS,
    Icon: Users,
  },
  {
    title: 'Glossário',
    meta: 'Termos Teológicos',
    description: 'Definições curadas com Nexus contextual.',
    to: AppRoute.GLOSSARY,
    Icon: Sparkles,
  },
  {
    title: 'Temas',
    meta: 'Rede de Conceitos',
    description: 'Explore o grafo de assuntos interconectados.',
    to: AppRoute.TEMAS,
    Icon: TagIcon,
  },
  {
    title: 'Comunidade',
    meta: 'Discussões Vivas',
    description: 'Perguntas e reflexões compartilhadas por leitores.',
    to: AppRoute.COMMUNITY,
    Icon: MessageCircle,
  },
];

const SUGGESTIONS = [
  'Eucaristia',
  'Trindade',
  'Oração contemplativa',
  'Graça',
  'Escatologia',
  'Mariologia',
];

const AtriumBuscarPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') ?? '';
  const livro = searchParams.get('livro') ?? '';
  const capitulo = searchParams.get('capitulo') ?? '';
  const [draft, setDraft] = useState(urlQuery);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    setDraft(urlQuery);
  }, [urlQuery]);

  const hasQuery = urlQuery.trim().length >= 2;
  const hasBibleFilter = Boolean(livro && capitulo);
  const showResults = hasQuery || hasBibleFilter;

  const submit = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value.trim().length >= 2) next.set('q', value.trim());
    else next.delete('q');
    setSearchParams(next, { replace: true });
  };

  const clearBibleFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('livro');
    next.delete('capitulo');
    setSearchParams(next, { replace: true });
  };


  return (
    <div
      className="min-h-screen w-full bg-stitch-background text-stitch-on-background"
      style={{
        backgroundImage:
          'url("https://www.transparenttextures.com/patterns/p6.png")',
      }}
    >
      <Helmet>
        <title>Cathedra — Pesquisa</title>
        <meta
          name="description"
          content="Pesquise a sabedoria da Igreja: Escritura, Catecismo, Magistério, Santos, temas e discussões — tudo interconectado pelo Nexus."
        />
        <meta property="og:title" content="Cathedra — Pesquisa" />
      </Helmet>

      <MobileTopBar kicker="Cathedra" title="Pesquisa" transparent />

      <main className="mx-auto w-full max-w-[1120px] px-5 pb-[calc(var(--stitch-mobile-bottomnav-h)+var(--stitch-mobile-safe-bottom)+2rem)] pt-6 md:px-16 md:pt-14 md:pb-16 animate-fade-in">
        {/* ─── Hero editorial ─────────────────────────────────────────── */}
        <section className="border-b border-stitch-secondary/10 pb-10">
          <div className="max-w-3xl">
            <span className="mb-2 block font-stitch-body text-[12px] font-bold uppercase tracking-[0.32em] text-stitch-secondary">
              Logos · Verbum in Principio
            </span>
            <h1 className="font-stitch-display text-[32px] italic leading-[40px] text-stitch-primary md:text-[56px] md:leading-[64px] md:tracking-[-0.02em]">
              Pesquise a sabedoria da Igreja.
            </h1>
            <p className="mt-4 font-stitch-body text-[20px] leading-[32px] text-stitch-on-surface-variant">
              Uma única busca atravessa Escritura, Catecismo, Magistério,
              Santos, temas e discussões da comunidade. Comece por uma palavra
              — o Nexus fará o resto.
            </p>
          </div>

          {/* Campo de busca editorial */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(draft);
            }}
            className="mt-8 flex items-center gap-3 border-b-2 border-stitch-primary/80 pb-3 focus-within:border-stitch-secondary"
          >
            <SearchIcon className="h-5 w-5 shrink-0 text-stitch-on-surface-variant" />
            <input
              type="search"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Qual é a sua dúvida espiritual hoje?"
              className="w-full bg-transparent font-stitch-display text-[20px] italic text-stitch-primary placeholder:text-stitch-on-surface-variant/60 focus:outline-none md:text-[24px]"
              autoFocus
              aria-label="Termo de pesquisa"
            />
            {draft && (
              <button
                type="button"
                onClick={() => {
                  setDraft('');
                  submit('');
                }}
                className="font-stitch-body text-[12px] font-bold uppercase tracking-[0.15em] text-stitch-on-surface-variant hover:text-stitch-primary"
              >
                Limpar
              </button>
            )}
          </form>

          {/* Filtro Bíblia: Livro / Capítulo */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.15em] text-stitch-on-surface-variant">
              Filtrar
            </span>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-stitch-outline-variant/40 bg-stitch-surface-container-low px-3 py-1.5 font-stitch-body text-[12px] font-bold uppercase tracking-[0.12em] text-stitch-on-surface-variant transition-colors hover:border-stitch-secondary hover:text-stitch-primary"
            >
              <BookFilterIcon className="h-3.5 w-3.5 text-stitch-secondary" />
              {livro && capitulo ? `${livro.toUpperCase()} ${capitulo}` : 'Livro / Capítulo'}
            </button>
            {(livro || capitulo) && (
              <button
                type="button"
                onClick={clearBibleFilter}
                className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.15em] text-stitch-on-surface-variant hover:text-stitch-primary"
              >
                Limpar filtro
              </button>
            )}
          </div>


          {/* Sugestões */}
          {!hasQuery && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="font-stitch-body text-[12px] font-bold uppercase tracking-[0.15em] text-stitch-on-surface-variant">
                Sugestões
              </span>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="rounded-full border border-stitch-outline-variant/40 bg-stitch-surface-container-low px-3 py-1 font-stitch-body text-[13px] text-stitch-on-surface-variant transition-colors hover:border-stitch-secondary hover:text-stitch-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ─── Resultados (delegação) ou Territórios ────────────────── */}
        {hasQuery ? (
          <section className="pt-10">
            <Suspense
              fallback={
                <p className="py-16 text-center font-stitch-body text-[14px] text-stitch-on-surface-variant">
                  Buscando sabedoria…
                </p>
              }
            >
              <GlobalSearchPage />
            </Suspense>
          </section>
        ) : (
          <section className="pt-16">
            <div className="mb-10 flex items-end justify-between">
              <h2 className="font-stitch-display text-[24px] font-semibold leading-[32px] text-stitch-primary">
                Territórios da Pesquisa
              </h2>
              <div className="hidden h-px flex-1 bg-stitch-secondary/20 md:mx-8 md:block" />
              <span className="hidden font-stitch-body text-[12px] font-bold uppercase tracking-[0.15em] text-stitch-on-surface-variant md:inline">
                06 Acervos
              </span>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {TERRITORIES.map((t, i) => (
                <Link
                  key={t.title}
                  to={t.to}
                  className="group relative flex flex-col border border-stitch-outline-variant/20 bg-stitch-surface-container-lowest p-6 transition-all hover:border-stitch-secondary/40 hover:shadow-xl hover:shadow-black/[0.04]"
                >
                  <div className="absolute left-0 top-0 h-full w-1 origin-top scale-y-0 bg-stitch-secondary transition-transform group-hover:scale-y-100" />
                  <div className="mb-4 flex items-center justify-between">
                    <t.Icon className="h-6 w-6 text-stitch-secondary" />
                    <span className="font-stitch-display text-[32px] italic text-stitch-secondary/25">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="font-stitch-display text-[20px] leading-tight text-stitch-primary transition-colors group-hover:text-stitch-secondary">
                    {t.title}
                  </h3>
                  <p className="mt-1 font-stitch-body text-[12px] font-bold uppercase tracking-[0.15em] text-stitch-on-surface-variant">
                    {t.meta}
                  </p>
                  <p className="mt-3 font-stitch-body text-[14px] leading-relaxed text-stitch-on-surface-variant">
                    {t.description}
                  </p>
                  <div className="mt-6 flex items-center justify-end text-stitch-secondary">
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>

            <p className="mt-12 border-t border-stitch-secondary/10 pt-6 text-center font-stitch-body text-[13px] italic text-stitch-on-surface-variant">
              "No princípio era o Verbo, e o Verbo estava com Deus." — Jo 1,1
            </p>
          </section>
        )}
      </main>

      <MobileBottomNav />
      <BiblePickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        selectionOnly
        onSelect={(sel) => {
          const next = new URLSearchParams(searchParams);
          next.set('livro', sel.abbr);
          next.set('capitulo', String(sel.chapter));
          setSearchParams(next, { replace: true });
        }}
      />
    </div>
  );
};

export default AtriumBuscarPage;
