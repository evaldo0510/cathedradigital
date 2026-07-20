/**
 * GlossaryTermPage — Reader editorial do Léxico Teológico (CAT-13.1).
 *
 * Rota: /glossario/:slug
 *
 * Renderiza um verbete completo com o chrome editorial Logos 2030
 * (EditorialReaderChrome + EditorialHero + primitives) em 11 seções ordenadas
 * por `sections_order` (definido no banco). Seções sem conteúdo mostram
 * EditorialEmptyState discreto ("Em preparação"), permitindo publicação
 * incremental sem quebrar o layout.
 *
 * Escrita/edição: apenas via /admin (CAT-13.1c). Aqui é somente leitura pública.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { EditorialShell, EditorialHero } from '@/components/editorial';
import {
  EditorialKicker,
  EditorialEmptyState,
  EditorialGoldMarker,
  EditorialQuote,
} from '@/components/editorial/primitives';
import EditorialReaderChrome from '@/components/editorial/EditorialReaderChrome';
import ReaderContinuation from '@/components/shared/ReaderContinuation';
import { buildPassageUrl } from '@/lib/passageUrl';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

type SectionKey =
  | 'definition'
  | 'interpretation'
  | 'application'
  | 'bible'
  | 'catechism'
  | 'magisterium'
  | 'saints'
  | 'fathers'
  | 'journey'
  | 'prayer'
  | 'nexus';

interface NexusRef {
  kind?: string;
  target?: string;
  note?: string;
  label?: string;
}

interface GlossaryTerm {
  id: string;
  slug: string | null;
  term: string;
  category: string | null;
  definition: string;
  interpretation: string | null;
  deep_interpretation: string | null;
  practical_application: string | null;
  bible_verses: string[] | null;
  catechism_references: string[] | null;
  magisterium_references: string[] | null;
  saints_refs: string[] | null;
  fathers_refs: string[] | null;
  prayer_refs: string[] | null;
  journey_refs: string[] | null;
  nexus_refs: NexusRef[] | null;
  sections_order: string[] | null;
  status: string | null;
  updated_at: string;
}

const DEFAULT_ORDER: SectionKey[] = [
  'definition',
  'interpretation',
  'application',
  'bible',
  'catechism',
  'magisterium',
  'saints',
  'fathers',
  'journey',
  'prayer',
  'nexus',
];

const SECTION_META: Record<SectionKey, { kicker: string; title: string; anchor: string }> = {
  definition: { kicker: 'I · Fundamento', title: 'Definição', anchor: 'definicao' },
  interpretation: { kicker: 'II · Contemplação', title: 'Interpretação teológica', anchor: 'interpretacao' },
  application: { kicker: 'III · Vida', title: 'Aplicação prática', anchor: 'aplicacao' },
  bible: { kicker: 'IV · Escritura', title: 'Bíblia', anchor: 'biblia' },
  catechism: { kicker: 'V · Magistério vivo', title: 'Catecismo', anchor: 'catecismo' },
  magisterium: { kicker: 'VI · Doutrina', title: 'Magistério', anchor: 'magisterio' },
  saints: { kicker: 'VII · Comunhão', title: 'Santos relacionados', anchor: 'santos' },
  fathers: { kicker: 'VIII · Tradição', title: 'Padres relacionados', anchor: 'padres' },
  journey: { kicker: 'IX · Caminho', title: 'Jornada sugerida', anchor: 'jornada' },
  prayer: { kicker: 'X · Oração', title: 'Oração relacionada', anchor: 'oracao' },
  nexus: { kicker: 'XI · Nexus', title: 'Nexus completo', anchor: 'nexus' },
};

/* ------------------------------------------------------------------ */
/* Data hook                                                           */
/* ------------------------------------------------------------------ */

function useGlossaryTerm(slug: string | undefined) {
  const [term, setTerm] = useState<GlossaryTerm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      // Cast p/ any: colunas novas ainda não estão nos types gerados até rebuild.
      const { data, error: err } = await (supabase as any)
        .from('glossary')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (cancelled) return;

      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      setTerm(data as GlossaryTerm | null);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { term, loading, error };
}

/* ------------------------------------------------------------------ */
/* Renderização de seções                                              */
/* ------------------------------------------------------------------ */

function TextSection({ children }: { children: string | null | undefined }) {
  if (!children || !children.trim()) {
    return (
      <EditorialEmptyState
        kicker="Em preparação"
        title="Este trecho ainda está sendo escrito."
        description="O conteúdo teológico será publicado em breve."
      />
    );
  }
  return (
    <div className="prose prose-stitch max-w-[68ch] mx-auto font-stitch-serif text-stitch-body leading-stitch-body text-stitch-ink">
      {children.split(/\n{2,}/).map((para, i) => (
        <p key={i} className="mb-6">{para}</p>
      ))}
    </div>
  );
}

function RefList({
  items,
  emptyLabel,
  renderItem,
}: {
  items: string[] | null | undefined;
  emptyLabel: string;
  renderItem: (ref: string, i: number) => React.ReactNode;
}) {
  if (!items || items.length === 0) {
    return (
      <EditorialEmptyState
        kicker="Em preparação"
        title={emptyLabel}
        description="Referências serão adicionadas em breve."
      />
    );
  }
  return (
    <ul className="max-w-[68ch] mx-auto space-y-3 font-stitch-serif text-stitch-body text-stitch-ink">
      {items.map((ref, i) => (
        <li key={`${ref}-${i}`} className="flex gap-3 items-baseline">
          <EditorialGoldMarker />
          <div className="flex-1">{renderItem(ref, i)}</div>
        </li>
      ))}
    </ul>
  );
}

function NexusList({ refs }: { refs: NexusRef[] | null | undefined }) {
  if (!refs || refs.length === 0) {
    return (
      <EditorialEmptyState
        kicker="Em preparação"
        title="O Nexus deste verbete ainda não foi curado."
        description="As conexões teológicas serão publicadas em breve."
      />
    );
  }
  return (
    <ul className="max-w-[68ch] mx-auto space-y-4 font-stitch-serif text-stitch-body text-stitch-ink">
      {refs.map((r, i) => (
        <li key={i} className="flex gap-3 items-baseline">
          <EditorialGoldMarker />
          <div className="flex-1">
            <span className="font-stitch-label text-stitch-label-sm uppercase tracking-[0.24em] text-stitch-secondary mr-3">
              {r.kind ?? 'Nexus'}
            </span>
            <span className="font-medium">{r.label ?? r.target ?? '—'}</span>
            {r.note && <p className="mt-1 text-stitch-body-sm text-stitch-muted">{r.note}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

const GlossaryTermPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { term, loading, error } = useGlossaryTerm(slug);

  const order = useMemo<SectionKey[]>(() => {
    const raw = term?.sections_order?.length ? term.sections_order : DEFAULT_ORDER;
    return raw.filter((k): k is SectionKey => k in SECTION_META);
  }, [term]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="font-stitch-label text-stitch-label-sm uppercase tracking-[0.28em] text-stitch-muted">
          Abrindo verbete…
        </p>
      </div>
    );
  }

  if (error || !term) {
    return (
      <EditorialShell>
        <EditorialEmptyState
          kicker="Verbete não encontrado"
          title="Este verbete ainda não foi publicado."
          description={
            <>
              Talvez o endereço tenha mudado. Voltar ao{' '}
              <Link to="/glossario" className="underline decoration-stitch-secondary underline-offset-4">
                Léxico completo
              </Link>
              .
            </>
          }
          action={
            <button
              type="button"
              onClick={() => navigate('/glossario')}
              className="px-6 py-3 border border-stitch-secondary text-stitch-secondary uppercase tracking-[0.28em] text-stitch-label-sm hover:bg-stitch-secondary/10 transition"
            >
              Ir para o Léxico
            </button>
          }
        />
      </EditorialShell>
    );
  }

  const canonical =
    typeof window !== 'undefined' ? `${window.location.origin}/glossario/${term.slug}` : undefined;
  const description = (term.definition ?? '').slice(0, 155);

  return (
    <>
      <Helmet>
        <title>{`${term.term} — Léxico Teológico | Cathedra`}</title>
        <meta name="description" content={description} />
        {canonical && <link rel="canonical" href={canonical} />}
        <meta property="og:title" content={`${term.term} — Léxico Teológico`} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        {canonical && <meta property="og:url" content={canonical} />}
        <meta name="twitter:card" content="summary" />
      </Helmet>

      <EditorialReaderChrome
        kicker="Cathedra · Léxico"
        title={term.term}
        subtitle={term.category ?? undefined}
        backHref="/glossario"
        shareUrl={canonical}
      />

      <EditorialShell>
        <EditorialHero
          kicker={term.category ? `Léxico · ${term.category}` : 'Léxico Teológico'}
          title={term.term}
          subtitle={term.definition}
          size="md"
          parchment
        />

        {/* Sumário lateral (desktop) */}
        <div className="max-w-6xl mx-auto px-4 lg:grid lg:grid-cols-[220px_1fr] lg:gap-12 mt-8">
          <nav
            aria-label="Sumário do verbete"
            className="hidden lg:block sticky top-32 self-start"
          >
            <EditorialKicker className="mb-4">Sumário</EditorialKicker>
            <ol className="space-y-2 font-stitch-label text-stitch-label-sm uppercase tracking-[0.16em] text-stitch-muted">
              {order.map((k) => (
                <li key={k}>
                  <a
                    href={`#${SECTION_META[k].anchor}`}
                    className="hover:text-stitch-secondary transition"
                  >
                    {SECTION_META[k].title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="min-w-0">
            {order.map((k) => {
              const meta = SECTION_META[k];
              return (
                <section
                  key={k}
                  id={meta.anchor}
                  className={cn('scroll-mt-32 py-12 first:pt-0')}
                  aria-labelledby={`${meta.anchor}-title`}
                >
                  <header className="text-center mb-8">
                    <EditorialKicker>{meta.kicker}</EditorialKicker>
                    <h2
                      id={`${meta.anchor}-title`}
                      className="font-stitch-display text-stitch-display-sm md:text-stitch-display-md text-stitch-ink mt-3"
                    >
                      {meta.title}
                    </h2>
                    <div className="mt-4 mx-auto w-16 h-px bg-stitch-secondary" />
                  </header>

                  {k === 'definition' && <TextSection>{term.definition}</TextSection>}
                  {k === 'interpretation' && (
                    <TextSection>{term.interpretation ?? term.deep_interpretation}</TextSection>
                  )}
                  {k === 'application' && <TextSection>{term.practical_application}</TextSection>}
                  {k === 'bible' && (
                    <RefList
                      items={term.bible_verses}
                      emptyLabel="Passagens bíblicas ainda não indicadas."
                      renderItem={(ref) => (
                        <Link
                          to={`/bible?ref=${encodeURIComponent(ref)}`}
                          className="hover:text-stitch-secondary underline decoration-stitch-secondary/40 underline-offset-4"
                        >
                          {ref}
                        </Link>
                      )}
                    />
                  )}
                  {k === 'catechism' && (
                    <RefList
                      items={term.catechism_references}
                      emptyLabel="Referências do Catecismo ainda não indicadas."
                      renderItem={(ref) => {
                        const num = ref.replace(/\D+/g, '');
                        return (
                          <Link
                            to={num ? `/catechism?p=${num}` : '/catechism'}
                            className="hover:text-stitch-secondary underline decoration-stitch-secondary/40 underline-offset-4"
                          >
                            §{num || ref}
                          </Link>
                        );
                      }}
                    />
                  )}
                  {k === 'magisterium' && (
                    <RefList
                      items={term.magisterium_references}
                      emptyLabel="Documentos do Magistério ainda não indicados."
                      renderItem={(ref) => (
                        <Link
                          to={`/magisterium/${encodeURIComponent(ref)}`}
                          className="hover:text-stitch-secondary underline decoration-stitch-secondary/40 underline-offset-4"
                        >
                          {ref}
                        </Link>
                      )}
                    />
                  )}
                  {k === 'saints' && (
                    <RefList
                      items={term.saints_refs}
                      emptyLabel="Santos relacionados ainda não indicados."
                      renderItem={(ref) => (
                        <Link
                          to={`/saints/${ref}`}
                          className="hover:text-stitch-secondary underline decoration-stitch-secondary/40 underline-offset-4"
                        >
                          {ref}
                        </Link>
                      )}
                    />
                  )}
                  {k === 'fathers' && (
                    <RefList
                      items={term.fathers_refs}
                      emptyLabel="Padres relacionados ainda não indicados."
                      renderItem={(ref) => (
                        <Link
                          to={`/padres/${ref}`}
                          className="hover:text-stitch-secondary underline decoration-stitch-secondary/40 underline-offset-4"
                        >
                          {ref}
                        </Link>
                      )}
                    />
                  )}
                  {k === 'journey' && (
                    <RefList
                      items={term.journey_refs}
                      emptyLabel="Jornada sugerida ainda não indicada."
                      renderItem={(ref) => (
                        <Link
                          to={`/jornadas/${ref}`}
                          className="hover:text-stitch-secondary underline decoration-stitch-secondary/40 underline-offset-4"
                        >
                          Abrir jornada
                        </Link>
                      )}
                    />
                  )}
                  {k === 'prayer' && (
                    <RefList
                      items={term.prayer_refs}
                      emptyLabel="Oração relacionada ainda não indicada."
                      renderItem={(ref) => (
                        <Link
                          to={`/prayers/${ref}`}
                          className="hover:text-stitch-secondary underline decoration-stitch-secondary/40 underline-offset-4"
                        >
                          {ref}
                        </Link>
                      )}
                    />
                  )}
                  {k === 'nexus' && <NexusList refs={term.nexus_refs} />}
                </section>
              );
            })}

            <EditorialQuote className="my-16" cite="Sto. Tomás de Aquino">
              A palavra do sábio é como uma luz que dissipa as trevas do coração.
            </EditorialQuote>

            <ReaderContinuation
              context={{
                kind: 'glossary-term',
                id: term.slug ?? term.id,
                meta: { theme: term.category ?? undefined },
              }}
            />
          </div>
        </div>
      </EditorialShell>
    </>
  );
};

export default GlossaryTermPage;
